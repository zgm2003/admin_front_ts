import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { Id } from '@/types/common'

export type AiMessageContentType = components['schemas']['AIMessageItem']['content_type']
export type AiChatAttachment = components['schemas']['AIMessageMetaAttachment']
export type AiMessageAttachmentRequest = components['schemas']['AIAttachmentRequest']
export type AiMessageMeta = components['schemas']['AIMessageMeta']
export type AiMessageItem = components['schemas']['AIMessageItem']
export type AiMessageListResponse = components['schemas']['AIMessageListResult']
export type AiMessageSendResponse = components['schemas']['AIMessageSendResult']
export type AiMessageCancelResponse = components['schemas']['AIMessageCancelResult']
export type AIRuntimeParams = components['schemas']['AIRuntimeParams']

export interface AiMessageListParams {
  conversation_id: number
  before_id?: number
  limit?: number
}

export interface AiMessageSendParams {
  conversation_id: number
  content?: string
  request_id: string
  attachments?: AiMessageAttachmentRequest[]
  runtime_params?: AIRuntimeParams
}

export interface AiMessageCancelParams {
  conversation_id: number
  request_id: string
}

type AiMessageListQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_ai_conversations_id_messages'>['query']>

function positiveID(value: Id | number, label = 'AI message id'): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} must be a positive integer`)
  return id
}

function normalizeListParams(params: AiMessageListParams): AiMessageListQueryParams {
  const query: AiMessageListQueryParams = {}
  if (typeof params.before_id === 'number') query.before_id = params.before_id
  if (typeof params.limit === 'number') query.limit = params.limit
  return query
}

export const AiMessageApi = {
  list: (
    params: AiMessageListParams,
    options: ExecuteOptions = {},
  ): Promise<AiMessageListResponse> => executeAdminOperation(
    adminOperations.get_api_admin_v1_ai_conversations_id_messages,
    {
      path: { id: positiveID(params.conversation_id, 'conversation id') },
      query: normalizeListParams(params),
    },
    options,
  ),

  send: (
    params: AiMessageSendParams,
    options: ExecuteOptions = {},
  ): Promise<AiMessageSendResponse> => executeAdminOperation(
    adminOperations.post_api_admin_v1_ai_conversations_id_messages,
    {
      path: { id: positiveID(params.conversation_id, 'conversation id') },
      body: {
        content: params.content,
        request_id: params.request_id,
        attachments: params.attachments,
        runtime_params: params.runtime_params,
      },
    },
    options,
  ),

  cancel: (
    params: AiMessageCancelParams,
    options: ExecuteOptions = {},
  ): Promise<AiMessageCancelResponse> => executeAdminOperation(
    adminOperations.post_api_admin_v1_ai_conversations_id_messages_cancel,
    {
      path: { id: positiveID(params.conversation_id, 'conversation id') },
      body: { request_id: params.request_id },
    },
    options,
  ),
}
