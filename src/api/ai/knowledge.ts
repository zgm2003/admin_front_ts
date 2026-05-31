import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

export type AiKnowledgeSourceType = 'text' | 'markdown' | 'file'
export type AiKnowledgeIndexStatus = 'pending' | 'indexed' | 'failed'

export interface AiKnowledgeInitResponse {
  dict: {
    common_status_arr: DictOption<number>[]
    source_type_arr: DictOption<AiKnowledgeSourceType>[]
    index_status_arr: DictOption<AiKnowledgeIndexStatus>[]
  }
}

export interface AiKnowledgeListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  name?: string
  code?: string
  status?: number | ''
}

export interface AiKnowledgeBaseItem {
  id: number
  name: string
  code: string
  description: string
  chunk_size_chars: number
  chunk_overlap_chars: number
  default_top_k: number
  default_min_score: number
  default_max_context_chars: number
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiKnowledgeBaseMutationParams {
  id?: Id
  name: string
  code: string
  description: string
  chunk_size_chars: number
  chunk_overlap_chars: number
  default_top_k: number
  default_min_score: number
  default_max_context_chars: number
  status: number
}

export interface AiKnowledgeBaseMutationBody {
  name: string
  code: string
  description: string
  chunk_size_chars: number
  chunk_overlap_chars: number
  default_top_k: number
  default_min_score: number
  default_max_context_chars: number
  status: number
}

export interface AiKnowledgeCreateResponse {
  id: number
}

export interface AiKnowledgeDocumentListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  title?: string
  status?: number | ''
}

export interface AiKnowledgeDocumentItem {
  id: number
  knowledge_base_id: number
  title: string
  source_type: AiKnowledgeSourceType
  source_type_name: string
  source_ref: string
  index_status: AiKnowledgeIndexStatus
  index_status_name: string
  error_message: string
  last_indexed_at: string
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiKnowledgeDocumentDetail extends AiKnowledgeDocumentItem {
  content: string
}

export interface AiKnowledgeDocumentMutationParams {
  id?: Id
  knowledge_base_id?: Id
  title: string
  source_type: AiKnowledgeSourceType
  source_ref: string
  content: string
  status: number
}

export interface AiKnowledgeDocumentMutationBody {
  title: string
  source_type: AiKnowledgeSourceType
  source_ref: string
  content: string
  status: number
}

export interface AiKnowledgeChunkItem {
  id: number
  knowledge_base_id: number
  document_id: number
  chunk_index: number
  title: string
  content: string
  content_chars: number
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiKnowledgeChunkListResponse {
  list: AiKnowledgeChunkItem[]
}

export interface AiKnowledgeRetrievalTestParams {
  knowledge_base_id: Id
  query: string
  top_k?: number
  min_score?: number
  max_context_chars?: number
}

export interface AiKnowledgeRetrievalTestBody {
  query: string
  top_k?: number
  min_score?: number
  max_context_chars?: number
}

export interface AiKnowledgeRetrievalHit {
  knowledge_base_id: number
  knowledge_base_name: string
  document_id: number
  document_title: string
  chunk_id: number
  chunk_index: number
  score: number
  rank_no: number
  content: string
  content_chars: number
  status: number
  skip_reason: string
}

export interface AiKnowledgeSelectedHit {
  ref: string
  knowledge_base_id: number
  knowledge_base_name: string
  document_id: number
  document_title: string
  chunk_id: number
  chunk_index: number
  score: number
  rank_no: number
  content: string
}

export interface AiKnowledgeRetrievalTestResponse {
  query: string
  status: string
  total_hits: number
  selected_hits: number
  hits: AiKnowledgeRetrievalHit[]
  selected: AiKnowledgeSelectedHit[]
}

interface AiKnowledgeListQueryParams {
  current_page?: number
  page_size?: number
  name?: string
  code?: string
  status?: number
}

interface AiKnowledgeDocumentListQueryParams {
  current_page?: number
  page_size?: number
  title?: string
  status?: number
}

function positiveID(value: Id | number, label: string): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} must be a positive integer`)
  return id
}

function normalizeListParams(params: AiKnowledgeListParams): AiKnowledgeListQueryParams {
  const query: AiKnowledgeListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (typeof params.name === 'string' && params.name.trim()) query.name = params.name.trim()
  if (typeof params.code === 'string' && params.code.trim()) query.code = params.code.trim()
  if (typeof params.status === 'number') query.status = params.status
  return query
}

function normalizeDocumentListParams(params: AiKnowledgeDocumentListParams): AiKnowledgeDocumentListQueryParams {
  const query: AiKnowledgeDocumentListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (typeof params.title === 'string' && params.title.trim()) query.title = params.title.trim()
  if (typeof params.status === 'number') query.status = params.status
  return query
}

function baseBody(params: AiKnowledgeBaseMutationParams): AiKnowledgeBaseMutationBody {
  return {
    name: params.name,
    code: params.code,
    description: params.description,
    chunk_size_chars: params.chunk_size_chars,
    chunk_overlap_chars: params.chunk_overlap_chars,
    default_top_k: params.default_top_k,
    default_min_score: params.default_min_score,
    default_max_context_chars: params.default_max_context_chars,
    status: params.status,
  }
}

function documentBody(params: AiKnowledgeDocumentMutationParams): AiKnowledgeDocumentMutationBody {
  return {
    title: params.title,
    source_type: params.source_type,
    source_ref: params.source_ref,
    content: params.content,
    status: params.status,
  }
}

function retrievalTestBody(params: AiKnowledgeRetrievalTestParams): AiKnowledgeRetrievalTestBody {
  const body: AiKnowledgeRetrievalTestBody = { query: params.query }
  if (typeof params.top_k === 'number') body.top_k = params.top_k
  if (typeof params.min_score === 'number') body.min_score = params.min_score
  if (typeof params.max_context_chars === 'number') body.max_context_chars = params.max_context_chars
  return body
}

function deleteBase(id: Id): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${positiveID(id, 'AI knowledge base id')}`)
}

const pageInit = () => request.get<AiKnowledgeInitResponse>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/page-init`)
const create = (params: AiKnowledgeBaseMutationParams) => request.post<AiKnowledgeCreateResponse, AiKnowledgeBaseMutationBody>(`${ADMIN_API_PREFIX}/ai-knowledge-bases`, baseBody(params))
const update = (params: AiKnowledgeBaseMutationParams) => {
  const id = positiveID(params.id ?? 0, 'AI knowledge base id')
  return request.put<void, AiKnowledgeBaseMutationBody>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${id}`, baseBody(params))
}
const changeStatus = (params: { id: Id; status: number }) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${positiveID(params.id, 'AI knowledge base id')}/status`, { status: params.status })
const deleteOne = (params: { id: Id }) => deleteBase(params.id)
const deleteBatch = async (params: { ids: Id[] }) => {
  await Promise.all(params.ids.map((item) => deleteOne({ id: item })))
}
const del = async (params: { id: Id | Id[] }) => {
  const ids = Array.isArray(params.id) ? params.id : [params.id]
  await deleteBatch({ ids })
}
const createDocument = (params: AiKnowledgeDocumentMutationParams) => request.post<AiKnowledgeCreateResponse, AiKnowledgeDocumentMutationBody>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${positiveID(params.knowledge_base_id ?? 0, 'AI knowledge base id')}/documents`, documentBody(params))
const updateDocument = (params: AiKnowledgeDocumentMutationParams) => {
  const id = positiveID(params.id ?? 0, 'AI knowledge document id')
  return request.put<void, AiKnowledgeDocumentMutationBody>(`${ADMIN_API_PREFIX}/ai-knowledge-documents/${id}`, documentBody(params))
}

export const AiKnowledgeApi = {
  pageInit,
  list: (params: AiKnowledgeListParams) => request.get<PaginatedResponse<AiKnowledgeBaseItem>>(`${ADMIN_API_PREFIX}/ai-knowledge-bases`, { params: normalizeListParams(params) }),
  detail: (params: { id: Id }) => request.get<AiKnowledgeBaseItem>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${positiveID(params.id, 'AI knowledge base id')}`),
  create,
  update,
  changeStatus,
  deleteOne,
  deleteBatch,
  init: pageInit,
  add: create,
  edit: update,
  status: changeStatus,
  del,
  documents: (params: { knowledge_base_id: Id } & AiKnowledgeDocumentListParams) => request.get<PaginatedResponse<AiKnowledgeDocumentItem>>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${positiveID(params.knowledge_base_id, 'AI knowledge base id')}/documents`, { params: normalizeDocumentListParams(params) }),
  documentDetail: (params: { id: Id }) => request.get<AiKnowledgeDocumentDetail>(`${ADMIN_API_PREFIX}/ai-knowledge-documents/${positiveID(params.id, 'AI knowledge document id')}`),
  createDocument,
  updateDocument,
  addDocument: createDocument,
  editDocument: updateDocument,
  documentStatus: (params: { id: Id; status: number }) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-knowledge-documents/${positiveID(params.id, 'AI knowledge document id')}/status`, { status: params.status }),
  deleteDocument: (params: { id: Id }) => request.delete<void>(`${ADMIN_API_PREFIX}/ai-knowledge-documents/${positiveID(params.id, 'AI knowledge document id')}`),
  reindexDocument: (params: { id: Id }) => request.post<void>(`${ADMIN_API_PREFIX}/ai-knowledge-documents/${positiveID(params.id, 'AI knowledge document id')}/reindex`),
  chunks: (params: { id: Id }) => request.get<AiKnowledgeChunkListResponse>(`${ADMIN_API_PREFIX}/ai-knowledge-documents/${positiveID(params.id, 'AI knowledge document id')}/chunks`),
  retrievalTest: (params: AiKnowledgeRetrievalTestParams) => request.post<AiKnowledgeRetrievalTestResponse, AiKnowledgeRetrievalTestBody>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${positiveID(params.knowledge_base_id, 'AI knowledge base id')}/retrieval-tests`, retrievalTestBody(params)),
}
