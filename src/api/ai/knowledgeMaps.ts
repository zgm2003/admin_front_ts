import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'
import type { AiProviderDriver } from './providers'

export type JsonObject = Record<string, unknown>
export type AiKnowledgeVisibility = 'private' | 'public'
export type AiKnowledgeSourceType = 'text' | 'file'
export type AiKnowledgeIndexingStatus = 'waiting' | 'indexing' | 'completed' | 'failed' | string

export interface AiKnowledgeMapInitResponse {
  dict: {
    visibility_arr: DictOption<AiKnowledgeVisibility>[]
    source_type_arr: DictOption<AiKnowledgeSourceType>[]
    indexing_status_arr: DictOption<AiKnowledgeIndexingStatus>[]
    common_status_arr: DictOption<number>[]
    provider_options: Array<DictOption<number> & { engine_type: AiProviderDriver }>
  }
}

export interface AiKnowledgeMapListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  name?: string
  code?: string
  visibility?: AiKnowledgeVisibility | ''
  provider_id?: number | ''
  status?: number | ''
}

export interface AiKnowledgeMapItem {
  id: number
  provider_id: number
  provider_name: string
  engine_type: AiProviderDriver | string
  name: string
  code: string
  engine_dataset_id: string
  visibility: AiKnowledgeVisibility
  visibility_name?: string
  meta_json?: JsonObject | null
  status: number
  status_name?: string
  created_at: string
  updated_at: string
}

export interface AiKnowledgeMapMutationParams {
  id?: Id
  provider_id: number
  name: string
  code: string
  engine_dataset_id?: string
  visibility: AiKnowledgeVisibility
  meta_json?: JsonObject | null
  status?: number
}

export interface AiKnowledgeMapMutationBody {
  provider_id: number
  name: string
  code: string
  engine_dataset_id?: string
  visibility: AiKnowledgeVisibility
  meta_json?: JsonObject | null
  status: number
}

export interface AiKnowledgeMapCreateResponse {
  id: number
}

export interface AiKnowledgeDocumentItem {
  id: number
  knowledge_map_id: number
  name: string
  engine_document_id: string
  engine_batch: string
  source_type: AiKnowledgeSourceType
  source_type_name?: string
  source_ref?: string
  indexing_status: AiKnowledgeIndexingStatus
  error_message?: string
  meta_json?: JsonObject | null
  status: number
  status_name?: string
  created_at: string
  updated_at: string
}

export interface AiKnowledgeDocumentListResponse {
  list: AiKnowledgeDocumentItem[]
}

export interface AiKnowledgeDocumentMutationParams {
  knowledge_map_id: Id
  name: string
  source_type: AiKnowledgeSourceType
  source_ref?: string
  content?: string
  meta_json?: JsonObject | null
  status?: number
}

export interface AiKnowledgeDocumentMutationBody {
  name: string
  source_type: AiKnowledgeSourceType
  source_ref?: string
  content?: string
  meta_json?: JsonObject | null
  status: number
}

interface AiKnowledgeMapListQueryParams {
  current_page?: number
  page_size?: number
  name?: string
  code?: string
  visibility?: AiKnowledgeVisibility
  provider_id?: number
  status?: number
}

export function positiveID(value: Id | number, label: string): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} must be a positive integer`)
  return id
}

function normalizeListParams(params: AiKnowledgeMapListParams): AiKnowledgeMapListQueryParams {
  const query: AiKnowledgeMapListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (typeof params.name === 'string' && params.name.trim()) query.name = params.name.trim()
  if (typeof params.code === 'string' && params.code.trim()) query.code = params.code.trim()
  if (params.visibility) query.visibility = params.visibility
  if (typeof params.provider_id === 'number') query.provider_id = params.provider_id
  if (typeof params.status === 'number') query.status = params.status
  return query
}

function mapBody(params: AiKnowledgeMapMutationParams): AiKnowledgeMapMutationBody {
  return {
    provider_id: params.provider_id,
    name: params.name,
    code: params.code,
    engine_dataset_id: params.engine_dataset_id,
    visibility: params.visibility,
    meta_json: params.meta_json ?? null,
    status: params.status ?? 1,
  }
}

function documentBody(params: AiKnowledgeDocumentMutationParams): AiKnowledgeDocumentMutationBody {
  return {
    name: params.name,
    source_type: params.source_type,
    source_ref: params.source_ref,
    content: params.content,
    meta_json: params.meta_json ?? null,
    status: params.status ?? 1,
  }
}

function deleteMap(id: number): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-knowledge-maps/${id}`)
}

export const AiKnowledgeMapApi = {
  init: () => request.get<AiKnowledgeMapInitResponse>(`${ADMIN_API_PREFIX}/ai-knowledge-maps/page-init`),
  list: (params: AiKnowledgeMapListParams) => request.get<PaginatedResponse<AiKnowledgeMapItem>>(`${ADMIN_API_PREFIX}/ai-knowledge-maps`, { params: normalizeListParams(params) }),
  detail: (params: { id: Id }) => request.get<AiKnowledgeMapItem>(`${ADMIN_API_PREFIX}/ai-knowledge-maps/${positiveID(params.id, 'AI knowledge map id')}`),
  add: (params: AiKnowledgeMapMutationParams) => request.post<AiKnowledgeMapCreateResponse, AiKnowledgeMapMutationBody>(`${ADMIN_API_PREFIX}/ai-knowledge-maps`, mapBody(params)),
  edit: (params: AiKnowledgeMapMutationParams) => {
    const id = positiveID(params.id ?? 0, 'AI knowledge map id')
    return request.put<void, AiKnowledgeMapMutationBody>(`${ADMIN_API_PREFIX}/ai-knowledge-maps/${id}`, mapBody(params))
  },
  status: (params: { id: Id; status: number }) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-knowledge-maps/${positiveID(params.id, 'AI knowledge map id')}/status`, { status: params.status }),
  sync: (params: { id: Id }) => request.post<void>(`${ADMIN_API_PREFIX}/ai-knowledge-maps/${positiveID(params.id, 'AI knowledge map id')}/sync`),
  del: async (params: { id: Id | Id[] }): Promise<void> => {
    const ids = Array.isArray(params.id) ? params.id : [params.id]
    await Promise.all(ids.map((item) => deleteMap(positiveID(item, 'AI knowledge map id'))))
  },
  documents: (params: { knowledge_map_id: Id }) => request.get<AiKnowledgeDocumentListResponse>(`${ADMIN_API_PREFIX}/ai-knowledge-maps/${positiveID(params.knowledge_map_id, 'AI knowledge map id')}/documents`),
  addDocument: (params: AiKnowledgeDocumentMutationParams) => request.post<{ id: number }, AiKnowledgeDocumentMutationBody>(`${ADMIN_API_PREFIX}/ai-knowledge-maps/${positiveID(params.knowledge_map_id, 'AI knowledge map id')}/documents`, documentBody(params)),
  documentStatus: (params: { id: Id; status: number }) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-knowledge-documents/${positiveID(params.id, 'AI knowledge document id')}/status`, { status: params.status }),
  refreshDocumentStatus: (params: { id: Id }) => request.post<void>(`${ADMIN_API_PREFIX}/ai-knowledge-documents/${positiveID(params.id, 'AI knowledge document id')}/refresh-status`),
  deleteDocument: (params: { id: Id }) => request.delete<void>(`${ADMIN_API_PREFIX}/ai-knowledge-documents/${positiveID(params.id, 'AI knowledge document id')}`),
}
