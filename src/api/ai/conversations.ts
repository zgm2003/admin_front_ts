import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { Id } from '@/types/common'

export interface AiConversationListParams {
  agent_id?: number | ''
  before_time?: string
  before_id?: number
  limit?: number
}

export type AiConversationItem = components['schemas']['AIConversationItem']
export type AiConversationDetailResponse = components['schemas']['AIConversationDetail']
export type AiConversationListResponse = components['schemas']['AIConversationListResult']
type AiConversationListQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_ai_conversations'>['query']>

function normalizeListParams(params: AiConversationListParams = {}): AiConversationListQueryParams {
  const query: AiConversationListQueryParams = {}
  if (typeof params.agent_id === 'number') query.agent_id = params.agent_id
  const beforeTime = params.before_time
  const beforeID = params.before_id
  const hasTime = typeof beforeTime === 'string' && beforeTime.length > 0
  const hasID = typeof beforeID === 'number'
  if (hasTime !== hasID) {
    throw new Error('AI conversation cursor requires before_time and before_id together')
  }
  if (hasTime && hasID) {
    query.before_time = beforeTime
    query.before_id = beforeID
  }
  if (typeof params.limit === 'number') query.limit = params.limit
  return query
}

function positiveID(value: Id | number): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error('AI conversation id must be a positive integer')
  return id
}

async function deleteConversation(id: number, options: ExecuteOptions): Promise<void> {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_ai_conversations_id, {
    path: { id },
  }, options)
}

const create = (
  params: { agent_id: number; title?: string },
  options: ExecuteOptions = {},
): Promise<components['schemas']['AIConversationCreateResult']> => executeAdminOperation(
  adminOperations.post_api_admin_v1_ai_conversations,
  { body: params },
  options,
)

const update = async (
  params: { id: Id; title: string },
  options: ExecuteOptions = {},
): Promise<void> => {
  await executeAdminOperation(adminOperations.put_api_admin_v1_ai_conversations_id, {
    path: { id: positiveID(params.id) },
    body: { title: params.title },
  }, options)
}

const deleteOne = (
  params: { id: Id },
  options: ExecuteOptions = {},
): Promise<void> => deleteConversation(positiveID(params.id), options)

const deleteBatch = async (
  params: { ids: Id[] },
  options: ExecuteOptions = {},
): Promise<void> => {
  if (params.ids.length === 0) throw new Error('AI conversation ids must not be empty')
  await Promise.all(params.ids.map((item) => deleteOne({ id: item }, options)))
}

export const AiConversationApi = {
  list: (
    params: AiConversationListParams = {},
    options: ExecuteOptions = {},
  ): Promise<AiConversationListResponse> => executeAdminOperation(
    adminOperations.get_api_admin_v1_ai_conversations,
    { query: normalizeListParams(params) },
    options,
  ),
  detail: (
    params: { id: Id },
    options: ExecuteOptions = {},
  ): Promise<AiConversationDetailResponse> => executeAdminOperation(
    adminOperations.get_api_admin_v1_ai_conversations_id,
    { path: { id: positiveID(params.id) } },
    options,
  ),
  create,
  update,
  deleteOne,
  deleteBatch,
}
