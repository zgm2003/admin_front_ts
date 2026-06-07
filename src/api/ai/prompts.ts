import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

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

export interface AiPromptItem {
  id: number
  slug: string
  category: string
  title: string
  cover_url: string
  prompt: string
  preview: string
  tags_json: string
  source_url: string
  status: AiCommonStatus
  created_at: string
  updated_at: string
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

interface AiPromptListQueryParams {
  current_page?: number
  page_size?: number
  keyword?: string
  category?: string
  status?: AiCommonStatus
}

function positiveID(value: Id | number, label: string): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} must be a positive integer`)
  return id
}

function normalizeIDs(values: Id[]): number[] {
  return values.map((value) => positiveID(value, 'AI prompt id'))
}

function mutationID(value: Id | undefined): number {
  if (typeof value === 'undefined') {
    throw new Error('AI prompt id must be provided')
  }

  return positiveID(value, 'AI prompt id')
}

function requireOptionArray<T extends string | number>(value: unknown, field: string): DictOption<T>[] {
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array`)
  }

  return value as DictOption<T>[]
}

function normalizeAiPromptInitResponse(response: AiPromptInitResponse): AiPromptInitResponse {
  return {
    common_status_arr: requireOptionArray<AiCommonStatus>(response.common_status_arr, 'ai-prompts.page-init.common_status_arr'),
  }
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

const pageInit = async () => normalizeAiPromptInitResponse(
  await request.get<AiPromptInitResponse>(`${ADMIN_API_PREFIX}/ai-prompts/page-init`)
)
const list = (params: AiPromptListParams) => request.get<PaginatedResponse<AiPromptItem>>(`${ADMIN_API_PREFIX}/ai-prompts`, { params: normalizeListParams(params) })
const detail = (params: { id: Id }) => request.get<AiPromptItem>(`${ADMIN_API_PREFIX}/ai-prompts/${positiveID(params.id, 'AI prompt id')}`)
const create = (params: AiPromptMutationParams) => request.post<AiPromptCreateResponse, AiPromptMutationBody>(`${ADMIN_API_PREFIX}/ai-prompts`, mutationBody(params))
const update = (params: AiPromptMutationParams) => request.put<void, AiPromptMutationBody>(`${ADMIN_API_PREFIX}/ai-prompts/${mutationID(params.id)}`, mutationBody(params))
const changeStatus = (params: { id: Id; status: AiCommonStatus }) => request.patch<void, { status: AiCommonStatus }>(`${ADMIN_API_PREFIX}/ai-prompts/${positiveID(params.id, 'AI prompt id')}/status`, { status: params.status })
const deleteOne = (params: { id: Id }) => request.delete<void>(`${ADMIN_API_PREFIX}/ai-prompts/${positiveID(params.id, 'AI prompt id')}`)
const deleteBatch = (params: { ids: Id[] }) => request.delete<void, { ids: number[] }>(`${ADMIN_API_PREFIX}/ai-prompts`, { data: { ids: normalizeIDs(params.ids) } })

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
