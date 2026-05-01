import request from '@/lib/http'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

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
  permission_json?: Record<string, unknown> | null
  chunk_size: number
  chunk_overlap: number
  top_k: number
  score_threshold: number
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiKnowledgeBaseListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  name?: string
  visibility?: string | ''
  status?: number | ''
}

export interface AiKnowledgeBaseMutationParams extends RequestPayload {
  id?: number
  name: string
  description?: string | null
  visibility?: string
  permission_json?: Record<string, unknown> | null
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

export interface AiKnowledgeDocumentMutationParams extends RequestPayload {
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
  metadata_json?: Record<string, unknown> | null
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

export const AiKnowledgeApi = {
  init: (params?: RequestPayload) => request.post<AiKnowledgeInitResponse>('/api/admin/AiKnowledgeBases/init', params),
  list: (params: AiKnowledgeBaseListParams) => request.post<PaginatedResponse<AiKnowledgeBaseItem>>('/api/admin/AiKnowledgeBases/list', params),
  detail: (params: { id: Id }) => request.post<AiKnowledgeBaseItem>('/api/admin/AiKnowledgeBases/detail', params),
  add: (params: AiKnowledgeBaseMutationParams) => request.post<{ id: number }>('/api/admin/AiKnowledgeBases/add', params),
  edit: (params: AiKnowledgeBaseMutationParams) => request.post<void>('/api/admin/AiKnowledgeBases/edit', params),
  del: (params: { id: Id | Id[] }) => request.post<{ affected: number }>('/api/admin/AiKnowledgeBases/del', params),
  status: (params: { id: Id; status: number }) => request.post<{ affected: number }>('/api/admin/AiKnowledgeBases/status', params),
  documents: (params: RequestPayload & { knowledge_base_id: number }) =>
    request.post<PaginatedResponse<AiKnowledgeDocumentItem>>('/api/admin/AiKnowledgeBases/documents', params),
  documentDetail: (params: { id: Id; knowledge_base_id: number }) =>
    request.post<AiKnowledgeDocumentItem>('/api/admin/AiKnowledgeBases/documentDetail', params),
  addDocument: (params: AiKnowledgeDocumentMutationParams) => request.post<{ id: number }>('/api/admin/AiKnowledgeBases/addDocument', params),
  editDocument: (params: AiKnowledgeDocumentMutationParams & { id: number }) => request.post<void>('/api/admin/AiKnowledgeBases/editDocument', params),
  delDocument: (params: { id: Id; knowledge_base_id: number }) => request.post<{ affected: number }>('/api/admin/AiKnowledgeBases/delDocument', params),
  reindexDocument: (params: { id: Id; knowledge_base_id: number }) => request.post<{ chunk_count: number }>('/api/admin/AiKnowledgeBases/reindexDocument', params),
  chunks: (params: RequestPayload & { knowledge_base_id: number; document_id?: number }) =>
    request.post<PaginatedResponse<AiKnowledgeChunkItem>>('/api/admin/AiKnowledgeBases/chunks', params),
  retrievalTest: (params: { knowledge_base_id: number; query: string; top_k?: number }) =>
    request.post<AiKnowledgeRetrievalResponse>('/api/admin/AiKnowledgeBases/retrievalTest', params),
}
