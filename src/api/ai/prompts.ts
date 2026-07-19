import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { DictOption, Id, RequestPayload } from '@/types/common'

export type AiCommonStatus = 1 | 2

export interface AiPromptInitResponse {
  common_status_arr: DictOption<AiCommonStatus>[]
}

export interface AiPromptListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  keyword?: string
  category?: string
  status?: AiCommonStatus | ''
}

type AiPromptContractItem = components['schemas']['Go_internal_module_ai_prompt_Item_Output']
export type AiPromptItem = Omit<AiPromptContractItem, 'status'> & { status: AiCommonStatus }
export interface AiPromptListResponse extends Omit<components['schemas']['Go_internal_module_ai_prompt_ListResponse_Output'], 'list'> {
  list: AiPromptItem[]
}

export interface AiPromptMutationParams {
  id?: Id
  slug: string
  category: string
  title: string
  cover_url: string
  prompt: string
  preview: string
  tags_json: string
  source_url: string
  status: AiCommonStatus
}

export interface AiPromptMutationBody {
  slug: string
  category: string
  title: string
  cover_url: string
  prompt: string
  preview: string
  tags_json: string
  source_url: string
  status: AiCommonStatus
}

export interface AiPromptCreateResponse {
  id: number
}

type AiPromptListQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_ai_prompts'>['query']>

function positiveID(value: Id | number, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
  return value
}

function normalizeIDs(values: Id[]): number[] {
  const ids = values.map((value) => positiveID(value, 'AI prompt id'))
  if (ids.length === 0) throw new Error('AI prompt ids must not be empty')
  return ids
}

function mutationID(value: Id | undefined): number {
  if (typeof value === 'undefined') {
    throw new Error('AI prompt id must be provided')
  }

  return positiveID(value, 'AI prompt id')
}

function isCommonStatus(value: number): value is AiCommonStatus {
  return value === 1 || value === 2
}

function normalizeAiPromptInitResponse(response: components['schemas']['Go_internal_module_ai_prompt_PageInitResponse_Output']): AiPromptInitResponse {
  const statuses = response.common_status_arr.map((option) => {
    if (!isCommonStatus(option.value)) throw new Error('ai-prompts.page-init.common_status_arr violates the contract')
    return { label: option.label, value: option.value }
  })
  return { common_status_arr: statuses }
}

function toPromptItem(item: AiPromptContractItem): AiPromptItem {
  if (!isCommonStatus(item.status)) throw new Error('AI prompt item status violates the editable contract')
  return { ...item, status: item.status }
}

function normalizeListParams(params: AiPromptListParams): AiPromptListQueryParams {
  const query: AiPromptListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (typeof params.keyword === 'string' && params.keyword.trim()) query.keyword = params.keyword.trim()
  if (typeof params.category === 'string' && params.category.trim()) query.category = params.category.trim()
  if (typeof params.status === 'number') query.status = params.status
  return query
}

function mutationBody(params: AiPromptMutationParams): AiPromptMutationBody {
  return {
    slug: params.slug,
    category: params.category,
    title: params.title,
    cover_url: params.cover_url,
    prompt: params.prompt,
    preview: params.preview,
    tags_json: params.tags_json,
    source_url: params.source_url,
    status: params.status,
  }
}

const pageInit = async (options: ExecuteOptions = {}): Promise<AiPromptInitResponse> => normalizeAiPromptInitResponse(
  await executeAdminOperation(adminOperations.get_api_admin_v1_ai_prompts_page_init, {}, options),
)
const list = async (params: AiPromptListParams, options: ExecuteOptions = {}): Promise<AiPromptListResponse> => {
  const response = await executeAdminOperation(adminOperations.get_api_admin_v1_ai_prompts, {
    query: normalizeListParams(params),
  }, options)
  return { list: response.list.map(toPromptItem), page: response.page }
}
const detail = async (params: { id: Id }, options: ExecuteOptions = {}): Promise<AiPromptItem> => {
  const response = await executeAdminOperation(adminOperations.get_api_admin_v1_ai_prompts_id, {
    path: { id: positiveID(params.id, 'AI prompt id') },
  }, options)
  return toPromptItem(response)
}
const create = (params: AiPromptMutationParams, options: ExecuteOptions = {}): Promise<AiPromptCreateResponse> =>
  executeAdminOperation(adminOperations.post_api_admin_v1_ai_prompts, { body: mutationBody(params) }, options)
const update = async (params: AiPromptMutationParams, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.put_api_admin_v1_ai_prompts_id, {
    path: { id: mutationID(params.id) },
    body: mutationBody(params),
  }, options)
}
const changeStatus = async (params: { id: Id; status: AiCommonStatus }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.patch_api_admin_v1_ai_prompts_id_status, {
    path: { id: positiveID(params.id, 'AI prompt id') },
    body: { status: params.status },
  }, options)
}
const deleteOne = async (params: { id: Id }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_ai_prompts_id, {
    path: { id: positiveID(params.id, 'AI prompt id') },
  }, options)
}
const deleteBatch = async (params: { ids: Id[] }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_ai_prompts, {
    body: { ids: normalizeIDs(params.ids) },
  }, options)
}

export const AiPromptApi = {
  pageInit,
  list,
  detail,
  create,
  update,
  changeStatus,
  deleteOne,
  deleteBatch,
}
