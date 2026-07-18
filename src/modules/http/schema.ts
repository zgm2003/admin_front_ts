import { z } from 'zod'
import { permissionCodes } from '@/modules/routing/generated/permissions'
import { backendViewKeys } from '@/modules/routing/generated/views'

export const backendErrorCategorySchema = z.enum([
  'authentication',
  'authorization',
  'canceled',
  'conflict',
  'dependency',
  'internal',
  'not_found',
  'rate_limit',
  'timeout',
  'validation',
])

export const errorEnvelopeSchema = z.object({
  code: z.number().int(),
  data: z.unknown(),
  msg: z.string(),
  error: z.object({
    category: backendErrorCategorySchema,
    code: z.string().min(1),
    request_id: z.string().optional(),
    retryable: z.boolean(),
    trace_id: z.string().optional(),
  }).strict(),
}).strict()

export const successEnvelopeSchema = z.object({
  code: z.literal(0),
  data: z.unknown(),
  msg: z.string(),
}).strict()

export const authCredentialSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().min(1).optional(),
  refresh_expires_in: z.number().int().positive().optional(),
}).strict().superRefine((value, context) => {
  if ((value.refresh_token === undefined) !== (value.refresh_expires_in === undefined)) {
    context.addIssue({
      code: 'custom',
      message: 'refresh_token and refresh_expires_in must be present together',
    })
  }
})

export interface PrincipalMenuItem {
  readonly index: string
  readonly label: string
  readonly path: string
  readonly icon: string
  readonly children: readonly PrincipalMenuItem[]
  readonly i18n_key: string
  readonly sort: number
  readonly show_menu: number
  readonly parent_id: number
}

const principalMenuItemSchema: z.ZodType<PrincipalMenuItem> = z.lazy(() => z.object({
  index: z.string(),
  label: z.string(),
  path: z.string(),
  icon: z.string(),
  children: z.array(principalMenuItemSchema),
  i18n_key: z.string(),
  sort: z.number().int(),
  show_menu: z.union([z.literal(1), z.literal(2)]),
  parent_id: z.number().int().nonnegative(),
}).strict())

export const principalSchema = z.object({
  user_id: z.number().int().positive(),
  username: z.string(),
  avatar: z.string(),
  role_name: z.string(),
  permissions: z.array(principalMenuItemSchema),
  router: z.array(z.object({
    name: z.string().min(1),
    path: z.string().min(1),
    view_key: z.enum(backendViewKeys),
    meta: z.record(z.string(), z.string()),
  }).strict()),
  buttonCodes: z.array(z.enum(permissionCodes)).refine(
    (values) => new Set(values).size === values.length,
    { message: 'buttonCodes must contain unique permission codes' },
  ),
}).strict()

export type PrincipalContract = z.infer<typeof principalSchema>

export const paymentConfigMutationResultSchema = z.object({
  id: z.number().int().positive(),
}).strict()

export const paymentRechargeMutationResultSchema = z.object({
  id: z.number().int().positive(),
  recharge_no: z.string().min(1),
  payment_order_no: z.string().min(1),
  status: z.string().min(1),
  pay_url: z.string(),
}).strict()

export const aiCommandStateSchema = z.object({
  conversation_id: z.number().int().positive(),
  user_message_id: z.number().int().positive(),
  command_id: z.number().int().positive(),
  request_id: z.string().min(1),
  state: z.enum([
    'pending',
    'claimed',
    'running',
    'succeeded',
    'failed',
    'canceled',
    'outcome_unknown',
    'timed_out',
  ]),
}).strict()

export const exportMutationResultSchema = z.object({
  id: z.number().int().positive(),
  message: z.string(),
}).strict()

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>
export type SuccessEnvelope = z.infer<typeof successEnvelopeSchema>
