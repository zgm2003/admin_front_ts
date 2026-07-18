import { z } from 'zod'

const safePositiveInteger = z.number().int().positive().refine(Number.isSafeInteger)
const safeNonNegativeInteger = z.number().int().nonnegative().refine(Number.isSafeInteger)
const maxCodePoints = (limit: number) => z.string().refine((value) => [...value].length <= limit)
const requestIdSchema = maxCodePoints(128)
const requiredRequestIdSchema = maxCodePoints(128).refine((value) => /\S/.test(value))
const eventIdSchema = z.string().length(26).regex(/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/)
const occurredAtSchema = z.iso.datetime({ offset: true })
const topicSchema = maxCodePoints(128).refine((value) => /\S/.test(value))

const connectedPayloadSchema = z.strictObject({
  user_id: safePositiveInteger,
  platform: z.literal('admin'),
  heartbeat_interval_ms: safePositiveInteger,
})
const subscribedPayloadSchema = z.strictObject({
  topics: z.array(topicSchema).min(1).refine((topics) => new Set(topics).size === topics.length),
})
const resyncRequiredPayloadSchema = z.strictObject({
  latest_sequence: safeNonNegativeInteger,
})
const realtimeErrorPayloadSchema = z.strictObject({
  code: safePositiveInteger,
  msg: maxCodePoints(1_024).refine((value) => /\S/.test(value)),
})
const emptyPayloadSchema = z.strictObject({})
const pongPayloadSchema = z.strictObject({
  server_time: occurredAtSchema,
})
const notificationCreatedPayloadSchema = z.strictObject({
  task_id: safePositiveInteger,
  title: maxCodePoints(255),
  content: maxCodePoints(65_536),
  link: maxCodePoints(2_048),
  level: z.enum(['normal', 'urgent']),
  notification_type: z.enum(['error', 'info', 'success', 'warning']),
})
const aiStartPayloadSchema = z.strictObject({
  conversation_id: safePositiveInteger,
  request_id: requiredRequestIdSchema,
  user_message_id: safePositiveInteger,
  agent_id: safePositiveInteger,
})
const aiDeltaPayloadSchema = z.strictObject({
  conversation_id: safePositiveInteger,
  request_id: requiredRequestIdSchema,
  delta: maxCodePoints(65_536),
})
const aiCompletedPayloadSchema = z.strictObject({
  conversation_id: safePositiveInteger,
  request_id: requiredRequestIdSchema,
  assistant_message_id: safePositiveInteger,
})
const aiFailedPayloadSchema = z.strictObject({
  conversation_id: safePositiveInteger,
  request_id: requiredRequestIdSchema,
  msg: maxCodePoints(1_024).refine((value) => /\S/.test(value)),
})
const aiCanceledPayloadSchema = z.strictObject({
  conversation_id: safePositiveInteger,
  request_id: requiredRequestIdSchema,
})

export type ConnectedPayload = z.infer<typeof connectedPayloadSchema>
export type SubscribedPayload = z.infer<typeof subscribedPayloadSchema>
export type ResyncRequiredPayload = z.infer<typeof resyncRequiredPayloadSchema>
export type RealtimeErrorPayload = z.infer<typeof realtimeErrorPayloadSchema>
export type PongPayload = z.infer<typeof pongPayloadSchema>
export type NotificationCreatedPayload = z.infer<typeof notificationCreatedPayloadSchema>
export type AIStartPayload = z.infer<typeof aiStartPayloadSchema>
export type AIDeltaPayload = z.infer<typeof aiDeltaPayloadSchema>
export type AICompletedPayload = z.infer<typeof aiCompletedPayloadSchema>
export type AIFailedPayload = z.infer<typeof aiFailedPayloadSchema>
export type AICanceledPayload = z.infer<typeof aiCanceledPayloadSchema>

export type RealtimeEventMap = {
  'realtime.connected.v1': ConnectedPayload
  'realtime.subscribed.v1': SubscribedPayload
  'realtime.resync_required.v1': ResyncRequiredPayload
  'realtime.error.v1': RealtimeErrorPayload
  'realtime.ping.v1': Record<never, never>
  'realtime.pong.v1': PongPayload
  'notification.created.v1': NotificationCreatedPayload
  'ai.response.start.v1': AIStartPayload
  'ai.response.delta.v1': AIDeltaPayload
  'ai.response.completed.v1': AICompletedPayload
  'ai.response.failed.v1': AIFailedPayload
  'ai.response.canceled.v1': AICanceledPayload
}

export type RealtimeEventType = keyof RealtimeEventMap
export type DurableRealtimeEventType =
  | 'notification.created.v1'
  | 'ai.response.completed.v1'
  | 'ai.response.failed.v1'
  | 'ai.response.canceled.v1'

export interface Envelope<K extends RealtimeEventType> {
  readonly event_id: string
  readonly type: K
  readonly request_id?: string
  readonly sequence: number
  readonly occurred_at: string
  readonly durability: K extends DurableRealtimeEventType ? 'durable' : 'ephemeral'
  readonly data: RealtimeEventMap[K]
}

export type ServerEnvelope = {
  [K in RealtimeEventType]: Envelope<K>
}[RealtimeEventType]

export type DurableEnvelope = {
  [K in DurableRealtimeEventType]: Envelope<K>
}[DurableRealtimeEventType]

function serverEnvelopeSchema<
  K extends RealtimeEventType,
  S extends z.ZodType<RealtimeEventMap[K]>,
>(type: K, durability: 'durable' | 'ephemeral', data: S) {
  return z.strictObject({
    event_id: eventIdSchema,
    type: z.literal(type),
    request_id: requestIdSchema.optional(),
    sequence: durability === 'durable' ? safePositiveInteger : z.literal(0),
    occurred_at: occurredAtSchema,
    durability: z.literal(durability),
    data,
  })
}

const serverEnvelopeSchemas = {
  'realtime.connected.v1': serverEnvelopeSchema('realtime.connected.v1', 'ephemeral', connectedPayloadSchema),
  'realtime.subscribed.v1': serverEnvelopeSchema('realtime.subscribed.v1', 'ephemeral', subscribedPayloadSchema),
  'realtime.resync_required.v1': serverEnvelopeSchema('realtime.resync_required.v1', 'ephemeral', resyncRequiredPayloadSchema),
  'realtime.error.v1': serverEnvelopeSchema('realtime.error.v1', 'ephemeral', realtimeErrorPayloadSchema),
  'realtime.ping.v1': serverEnvelopeSchema('realtime.ping.v1', 'ephemeral', emptyPayloadSchema),
  'realtime.pong.v1': serverEnvelopeSchema('realtime.pong.v1', 'ephemeral', pongPayloadSchema),
  'notification.created.v1': serverEnvelopeSchema('notification.created.v1', 'durable', notificationCreatedPayloadSchema),
  'ai.response.start.v1': serverEnvelopeSchema('ai.response.start.v1', 'ephemeral', aiStartPayloadSchema),
  'ai.response.delta.v1': serverEnvelopeSchema('ai.response.delta.v1', 'ephemeral', aiDeltaPayloadSchema),
  'ai.response.completed.v1': serverEnvelopeSchema('ai.response.completed.v1', 'durable', aiCompletedPayloadSchema),
  'ai.response.failed.v1': serverEnvelopeSchema('ai.response.failed.v1', 'durable', aiFailedPayloadSchema),
  'ai.response.canceled.v1': serverEnvelopeSchema('ai.response.canceled.v1', 'durable', aiCanceledPayloadSchema),
} as const

export const realtimeEventTypes = Object.freeze(
  Object.keys(serverEnvelopeSchemas) as RealtimeEventType[],
)

function eventType(value: unknown): RealtimeEventType {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('realtime server envelope must be an object')
  }
  const type = Reflect.get(value, 'type')
  if (typeof type !== 'string' || !Object.prototype.hasOwnProperty.call(serverEnvelopeSchemas, type)) {
    throw new TypeError('realtime server envelope has an unknown type')
  }
  return type as RealtimeEventType
}

export function parseServerEnvelope(value: unknown): ServerEnvelope {
  const type = eventType(value)
  return serverEnvelopeSchemas[type].parse(value) as ServerEnvelope
}

export type ClientControlMap = {
  'realtime.ping.v1': Record<never, never>
  'realtime.resume.v1': { readonly after_sequence: number }
  'realtime.subscribe.v1': { readonly topics: readonly string[] }
}

export type ClientControlType = keyof ClientControlMap

export interface ClientEnvelope<K extends ClientControlType> {
  readonly type: K
  readonly request_id?: string
  readonly data: ClientControlMap[K]
}

const clientControlSchemas = {
  'realtime.ping.v1': emptyPayloadSchema,
  'realtime.resume.v1': z.strictObject({ after_sequence: safeNonNegativeInteger }),
  'realtime.subscribe.v1': z.strictObject({
    topics: z.array(topicSchema).min(1).refine((topics) => new Set(topics).size === topics.length),
  }),
} as const

export const clientControlTypes = Object.freeze(
  Object.keys(clientControlSchemas) as ClientControlType[],
)

export function createClientEnvelope<K extends ClientControlType>(
  type: K,
  data: ClientControlMap[K],
  requestId?: string,
): ClientEnvelope<K> {
  const parsedData = clientControlSchemas[type].parse(data) as ClientControlMap[K]
  const parsedRequestId = requestId === undefined ? undefined : requestIdSchema.parse(requestId)
  return parsedRequestId === undefined
    ? { type, data: parsedData }
    : { type, request_id: parsedRequestId, data: parsedData }
}

export function isDurableEnvelope(
  envelope: ServerEnvelope,
): envelope is DurableEnvelope {
  return envelope.durability === 'durable'
}
