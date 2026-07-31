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
type AiMessageSendBody = NonNullable<AdminOperationInput<'post_api_admin_v1_ai_conversations_id_messages'>['body']>
type AiMessageRevisionBody = NonNullable<AdminOperationInput<'post_api_admin_v1_ai_conversations_id_messages_message_id_revisions'>['body']>
export type AiMessageAttachmentRequest = NonNullable<AiMessageSendBody['attachments']>[number]
export type AiMessageMeta = components['schemas']['AIMessageMeta']
export type AiMessageItem = components['schemas']['AIMessageItem']
export type AiMessageListResponse = components['schemas']['AIMessageListResult']
export type AiMessageSendResponse = components['schemas']['AIMessageSendResult']
export type AiMessageCancelResponse = components['schemas']['AIMessageCancelResult']
export type AiMessageDeleteResponse = components['schemas']['AIMessageDeleteResult']
export type AIRuntimeParams = NonNullable<AiMessageSendBody['runtime_params']>

export interface AiMessageListParams {
  conversation_id: number
  before_id?: number
  limit?: number
}

export type AiMessageSendParams = AiMessageSendBody & { conversation_id: number }

export interface AiMessageCancelParams {
  conversation_id: number
  request_id: string
  delivered_seq: number
}

export type AiMessageRevisionParams = AiMessageRevisionBody & {
  conversation_id: number
  message_id: number
}

export interface AiMessageRegenerationParams {
  conversation_id: number
  message_id: number
  request_id: string
}

export interface AiMessageDeleteParams {
  conversation_id: number
  ids: number[]
}

type AiMessageListQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_ai_conversations_id_messages'>['query']>

function positiveID(value: Id | number, label = 'AI message id'): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
  return value
}

function nonEmptyRequestID(value: string): string {
  if (typeof value !== 'string' || !/\S/.test(value)) {
    throw new Error('AI request id must be non-empty')
  }
  return value
}

function nonEmptyRevisionContent(value: string): string {
  if (typeof value !== 'string' || !/\S/.test(value)) {
    throw new Error('AI revision content must be non-empty')
  }
  return value
}

function messageIDs(values: number[]): number[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('AI message ids must not be empty')
  }
  const ids = values.map((value) => positiveID(value))
  if (new Set(ids).size !== ids.length) {
    throw new Error('AI message ids must be unique')
  }
  return ids
}

function normalizeListParams(params: AiMessageListParams): AiMessageListQueryParams {
  const query: AiMessageListQueryParams = {}
  if (typeof params.before_id === 'number') query.before_id = params.before_id
  if (typeof params.limit === 'number') query.limit = params.limit
  return query
}

function nonNegativeDeliverySeq(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('AI delivered sequence must be a non-negative safe integer')
  }
  return value
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
      body: {
        request_id: nonEmptyRequestID(params.request_id),
        delivered_seq: nonNegativeDeliverySeq(params.delivered_seq),
      },
    },
    options,
  ),

  revise: (
    params: AiMessageRevisionParams,
    options: ExecuteOptions = {},
  ): Promise<AiMessageSendResponse> => executeAdminOperation(
    adminOperations.post_api_admin_v1_ai_conversations_id_messages_message_id_revisions,
    {
      path: {
        id: positiveID(params.conversation_id, 'conversation id'),
        message_id: positiveID(params.message_id),
      },
      body: {
        content: nonEmptyRevisionContent(params.content),
        request_id: nonEmptyRequestID(params.request_id),
        ...(params.attachments !== undefined ? { attachments: params.attachments } : {}),
      },
    },
    options,
  ),

  regenerate: (
    params: AiMessageRegenerationParams,
    options: ExecuteOptions = {},
  ): Promise<AiMessageSendResponse> => executeAdminOperation(
    adminOperations.post_api_admin_v1_ai_conversations_id_messages_message_id_regenerations,
    {
      path: {
        id: positiveID(params.conversation_id, 'conversation id'),
        message_id: positiveID(params.message_id),
      },
      body: { request_id: nonEmptyRequestID(params.request_id) },
    },
    options,
  ),

  deleteBatch: (
    params: AiMessageDeleteParams,
    options: ExecuteOptions = {},
  ): Promise<AiMessageDeleteResponse> => executeAdminOperation(
    adminOperations.delete_api_admin_v1_ai_conversations_id_messages,
    {
      path: { id: positiveID(params.conversation_id, 'conversation id') },
      body: { ids: messageIDs(params.ids) },
    },
    options,
  ),
}
