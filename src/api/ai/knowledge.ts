import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse } from '@/types/common'

export type JsonObject = { [key: string]: unknown }

export interface AiKnowledgeInitResponse {
  dict: {
    common_status_arr: DictOption<number>[]
    ai_knowledge_visibility_arr: DictOption<string>[]
    ai_knowledge_index_status_arr: DictOption<number>[]
    ai_knowledge_source_type_arr: DictOption<string>[]
  }
}

export interface AiKnowledgeBaseItem {
  id: number
  name: string
  description?: string | null
  owner_user_id: number
  visibility: string
  visibility_name: string
  permission_json?: JsonObject | null
  chunk_size: number
  chunk_overlap: number
  top_k: number
  score_threshold: number
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiKnowledgeBaseListParams {
  [key: string]: unknown
  current_page?: number
  page_size?: number
  name?: string
  visibility?: string | ''
  status?: number | ''
}

export interface AiKnowledgeBaseMutationParams {
  id?: number
  name: string
  description?: string | null
  visibility?: string
  permission_json?: JsonObject | null
  chunk_size?: number
  chunk_overlap?: number
  top_k?: number
  score_threshold?: number
  status?: number
}

export interface AiKnowledgeDocumentItem {
  id: number
  knowledge_base_id: number
  title: string
  source_type: string
  source_type_name: string
  chunk_count: number
  index_status: number
  index_status_name: string
  status: number
  status_name: string
  created_at: string
  updated_at: string
  content?: string
}

export interface AiKnowledgeDocumentMutationParams {
  id?: number
  knowledge_base_id: number
  title: string
  source_type?: string
  content: string
  status?: number
}

export interface AiKnowledgeChunkItem {
  id: number
  knowledge_base_id: number
  document_id: number
  chunk_no: number
  content: string
  token_estimate: number
  metadata_json?: JsonObject | null
  status: number
  created_at: string
}

export interface AiKnowledgeRetrievalChunk {
  knowledge_base_id: number
  document_id: number
  document_title: string
  chunk_no: number
  content: string
  score: number
}

export interface AiKnowledgeRetrievalResponse {
  chunks: AiKnowledgeRetrievalChunk[]
  context_prompt: string
}


interface AiKnowledgeBaseListQueryParams {
  current_page?: number
  page_size?: number
  name?: string
  visibility?: string
  status?: number
}

interface AiKnowledgeDocumentListParams {
  current_page?: number
  page_size?: number
  knowledge_base_id: number
  title?: string
  status?: number | ''
}

interface AiKnowledgeDocumentListQueryParams {
  current_page?: number
  page_size?: number
  title?: string
  status?: number
}

interface AiKnowledgeChunkListParams {
  current_page?: number
  page_size?: number
  knowledge_base_id: number
  document_id?: number
}

interface AiKnowledgeChunkListQueryParams {
  current_page?: number
  page_size?: number
  document_id?: number
}

function positiveID(value: Id | number, label = 'AI knowledge id'): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} must be a positive integer`)
  return id
}

function normalizeBaseListParams(params: AiKnowledgeBaseListParams): AiKnowledgeBaseListQueryParams {
  const query: AiKnowledgeBaseListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (params.name) query.name = params.name
  if (params.visibility) query.visibility = params.visibility
  if (typeof params.status === 'number') query.status = params.status
  return query
}

function normalizeDocumentListParams(params: AiKnowledgeDocumentListParams): AiKnowledgeDocumentListQueryParams {
  const query: AiKnowledgeDocumentListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (params.title) query.title = params.title
  if (typeof params.status === 'number') query.status = params.status
  return query
}

function normalizeChunkListParams(params: AiKnowledgeChunkListParams): AiKnowledgeChunkListQueryParams {
  const query: AiKnowledgeChunkListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (typeof params.document_id === 'number') query.document_id = params.document_id
  return query
}

function baseBody(params: AiKnowledgeBaseMutationParams): Omit<AiKnowledgeBaseMutationParams, 'id'> {
  return {
    name: params.name,
    description: params.description ?? null,
    visibility: params.visibility,
    permission_json: params.permission_json ?? null,
    chunk_size: params.chunk_size,
    chunk_overlap: params.chunk_overlap,
    top_k: params.top_k,
    score_threshold: params.score_threshold,
    status: params.status,
  }
}

function documentBody(params: AiKnowledgeDocumentMutationParams): Omit<AiKnowledgeDocumentMutationParams, 'id' | 'knowledge_base_id'> {
  return {
    title: params.title,
    source_type: params.source_type,
    content: params.content,
    status: params.status,
  }
}

function deleteKnowledgeBase(id: number): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${id}`)
}

export const AiKnowledgeApi = {
  init: () => request.get<AiKnowledgeInitResponse>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/page-init`),
  list: (params: AiKnowledgeBaseListParams) => request.get<PaginatedResponse<AiKnowledgeBaseItem>>(`${ADMIN_API_PREFIX}/ai-knowledge-bases`, { params: normalizeBaseListParams(params) }),
  detail: (params: { id: Id }) => request.get<AiKnowledgeBaseItem>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${positiveID(params.id)}`),
  add: (params: AiKnowledgeBaseMutationParams) => request.post<{ id: number }, Omit<AiKnowledgeBaseMutationParams, 'id'>>(`${ADMIN_API_PREFIX}/ai-knowledge-bases`, baseBody(params)),
  edit: (params: AiKnowledgeBaseMutationParams) => request.put<void, Omit<AiKnowledgeBaseMutationParams, 'id'>>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${positiveID(params.id ?? 0)}`, baseBody(params)),
  del: async (params: { id: Id | Id[] }): Promise<void> => {
    const ids = Array.isArray(params.id) ? params.id : [params.id]
    await Promise.all(ids.map((item) => deleteKnowledgeBase(positiveID(item))))
  },
  status: (params: { id: Id; status: number }) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${positiveID(params.id)}/status`, { status: params.status }),
  documents: (params: AiKnowledgeDocumentListParams) => {
    const knowledgeBaseID = positiveID(params.knowledge_base_id, 'knowledge base id')
    return request.get<PaginatedResponse<AiKnowledgeDocumentItem>>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${knowledgeBaseID}/documents`, { params: normalizeDocumentListParams(params) })
  },
  documentDetail: (params: { id: Id; knowledge_base_id: number }) => {
    const knowledgeBaseID = positiveID(params.knowledge_base_id, 'knowledge base id')
    return request.get<AiKnowledgeDocumentItem>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${knowledgeBaseID}/documents/${positiveID(params.id, 'document id')}`)
  },
  addDocument: (params: AiKnowledgeDocumentMutationParams) => {
    const knowledgeBaseID = positiveID(params.knowledge_base_id, 'knowledge base id')
    return request.post<{ id: number }, Omit<AiKnowledgeDocumentMutationParams, 'id' | 'knowledge_base_id'>>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${knowledgeBaseID}/documents`, documentBody(params))
  },
  editDocument: (params: AiKnowledgeDocumentMutationParams & { id: number }) => {
    const knowledgeBaseID = positiveID(params.knowledge_base_id, 'knowledge base id')
    return request.put<void, Omit<AiKnowledgeDocumentMutationParams, 'id' | 'knowledge_base_id'>>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${knowledgeBaseID}/documents/${positiveID(params.id, 'document id')}`, documentBody(params))
  },
  delDocument: (params: { id: Id; knowledge_base_id: number }) => {
    const knowledgeBaseID = positiveID(params.knowledge_base_id, 'knowledge base id')
    return request.delete<void>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${knowledgeBaseID}/documents/${positiveID(params.id, 'document id')}`)
  },
  reindexDocument: (params: { id: Id; knowledge_base_id: number }) => {
    const knowledgeBaseID = positiveID(params.knowledge_base_id, 'knowledge base id')
    return request.post<{ chunk_count: number }>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${knowledgeBaseID}/documents/${positiveID(params.id, 'document id')}/reindex`)
  },
  chunks: (params: AiKnowledgeChunkListParams) => {
    const knowledgeBaseID = positiveID(params.knowledge_base_id, 'knowledge base id')
    return request.get<PaginatedResponse<AiKnowledgeChunkItem>>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${knowledgeBaseID}/chunks`, { params: normalizeChunkListParams(params) })
  },
  retrievalTest: (params: { knowledge_base_id: number; query: string; top_k?: number }) => {
    const knowledgeBaseID = positiveID(params.knowledge_base_id, 'knowledge base id')
    return request.post<AiKnowledgeRetrievalResponse, { query: string; top_k?: number }>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${knowledgeBaseID}/retrieval-test`, { query: params.query, top_k: params.top_k })
  },
}
