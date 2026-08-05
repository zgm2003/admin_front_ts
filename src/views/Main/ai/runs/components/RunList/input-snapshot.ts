export interface RunInputSnapshotAttachment {
  ordinal: number
  type: 'image'
  mimeType: string | null
  name: string
  size: number
}

export interface RunInputSnapshotRuntimeParams {
  temperature?: number
  max_tokens?: number
}

export type RunInputSnapshot =
  | {
    kind: 'structured'
    content: string
    attachments: RunInputSnapshotAttachment[]
    runtimeParams: RunInputSnapshotRuntimeParams | null
  }
  | { kind: 'raw', text: string }

const snapshotKeys = new Set(['content', 'attachments', 'runtime_params', 'meta_json', 'request_identity'])
const metaKeys = new Set(['attachments', 'runtime_params'])
const attachmentKeys = new Set(['type', 'mime_type', 'name', 'size'])
const runtimeParamKeys = new Set(['temperature', 'max_tokens'])
const requestIdentityKeys = new Set(['operation', 'source_message_id'])

export function parseRunInputSnapshot(text: string): RunInputSnapshot {
  const raw = (): RunInputSnapshot => ({ kind: 'raw', text })
  let decoded: unknown
  try {
    decoded = JSON.parse(text)
  } catch {
    return raw()
  }
  if (!isRecord(decoded)
    || Object.keys(decoded).length === 0
    || !hasOnlyKeys(decoded, snapshotKeys)) return raw()

  const content = parseContent(decoded)
  if (content === undefined) return raw()
  if (hasOwn(decoded, 'request_identity') && !isHistoryRequestIdentity(decoded.request_identity)) return raw()

  let metadata = decoded
  if (hasOwn(decoded, 'meta_json')) {
    if (typeof decoded.meta_json !== 'string'
      || hasOwn(decoded, 'attachments')
      || hasOwn(decoded, 'runtime_params')) {
      return raw()
    }
    let parsedMeta: unknown
    try {
      parsedMeta = JSON.parse(decoded.meta_json)
    } catch {
      return raw()
    }
    if (!isRecord(parsedMeta) || !hasOnlyKeys(parsedMeta, metaKeys)) return raw()
    metadata = parsedMeta
  }

  const attachments = parseAttachments(metadata)
  const runtimeParams = parseRuntimeParams(metadata)
  if (attachments === undefined || runtimeParams === undefined) return raw()
  if (content.trim() === '' && attachments.length === 0) return raw()

  return {
    kind: 'structured',
    content,
    attachments,
    runtimeParams,
  }
}

function parseContent(value: Record<string, unknown>): string | undefined {
  if (!hasOwn(value, 'content')) return ''
  return typeof value.content === 'string' ? value.content : undefined
}

function parseAttachments(
  value: Record<string, unknown>,
): RunInputSnapshotAttachment[] | undefined {
  if (!hasOwn(value, 'attachments')) return []
  if (!Array.isArray(value.attachments)) return undefined

  const attachments: RunInputSnapshotAttachment[] = []
  for (const [index, item] of value.attachments.entries()) {
    if (!isRecord(item)
      || !hasOnlyKeys(item, attachmentKeys)
      || (item.type !== 'image' && item.type !== 'file')
      || typeof item.name !== 'string'
      || !isNonNegativeInteger(item.size)) {
      return undefined
    }
    if (item.type === 'file') {
      if (hasOwn(item, 'mime_type') && !isMIMEType(item.mime_type)) return undefined
      continue
    }
    let mimeType: string | null = null
    if (hasOwn(item, 'mime_type')) {
      if (!isImageMIMEType(item.mime_type)) return undefined
      mimeType = item.mime_type
    }
    attachments.push({
      ordinal: index + 1,
      type: item.type,
      mimeType,
      name: item.name,
      size: item.size,
    })
  }
  return attachments
}

function isImageMIMEType(value: unknown): value is string {
  return typeof value === 'string' && /^image\/[a-z0-9.+-]+$/i.test(value.trim())
}

function isMIMEType(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(value.trim())
}

function isHistoryRequestIdentity(value: unknown): boolean {
  if (!isRecord(value) || !hasOnlyKeys(value, requestIdentityKeys)) return false
  return (value.operation === 'chat.revision' || value.operation === 'chat.regeneration')
    && isNonNegativeInteger(value.source_message_id)
    && value.source_message_id > 0
}

function parseRuntimeParams(
  value: Record<string, unknown>,
): RunInputSnapshotRuntimeParams | null | undefined {
  if (!hasOwn(value, 'runtime_params')) return null
  const params = value.runtime_params
  if (!isRecord(params) || !hasOnlyKeys(params, runtimeParamKeys)) return undefined

  const runtimeParams: RunInputSnapshotRuntimeParams = {}
  if (hasOwn(params, 'temperature')) {
    if (!isFiniteNumberInRange(params.temperature, 0, 2)) return undefined
    runtimeParams.temperature = params.temperature
  }
  if (hasOwn(params, 'max_tokens')) {
    if (!isIntegerInRange(params.max_tokens, 1, 200000)) return undefined
    runtimeParams.max_tokens = params.max_tokens
  }
  return runtimeParams
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function hasOnlyKeys(value: Record<string, unknown>, keys: ReadonlySet<string>): boolean {
  return Object.keys(value).every((key) => keys.has(key))
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isFiniteNumberInRange(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= minimum
    && value <= maximum
}

function isIntegerInRange(value: unknown, minimum: number, maximum: number): value is number {
  return isFiniteNumberInRange(value, minimum, maximum) && Number.isInteger(value)
}
