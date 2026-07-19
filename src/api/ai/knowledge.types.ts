import type { components } from '@/modules/http/generated/admin'
import type { DictOption, Id, RequestPayload } from '@/types/common'

export type AiKnowledgeSourceType = 'text' | 'markdown' | 'file'
export type AiKnowledgeIndexStatus = 'pending' | 'indexed' | 'failed'
export type AiKnowledgeStatus = 1 | 2

export interface AiKnowledgeInitResponse {
  dict: {
    common_status_arr: DictOption<AiKnowledgeStatus>[]
    source_type_arr: DictOption<AiKnowledgeSourceType>[]
    index_status_arr: DictOption<AiKnowledgeIndexStatus>[]
  }
}

export interface AiKnowledgeListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  name?: string
  code?: string
  status?: AiKnowledgeStatus | ''
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
  status: AiKnowledgeStatus
  status_name: string
  created_at: string
  updated_at: string
}
export type AiKnowledgeBaseContract = components['schemas']['Go_internal_module_ai_knowledge_BaseDTO_Output']
export interface AiKnowledgeBaseListResponse extends Omit<components['schemas']['Go_internal_module_ai_knowledge_BaseListResponse_Output'], 'list'> {
  list: AiKnowledgeBaseItem[]
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
  status: AiKnowledgeStatus
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
  status: AiKnowledgeStatus
}

export interface AiKnowledgeCreateResponse {
  id: number
}

export interface AiKnowledgeDocumentListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  title?: string
  status?: AiKnowledgeStatus | ''
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
  status: AiKnowledgeStatus
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiKnowledgeDocumentDetail extends AiKnowledgeDocumentItem {
  content: string
}
export type AiKnowledgeDocumentContract = components['schemas']['Go_internal_module_ai_knowledge_DocumentDTO_Output']
export interface AiKnowledgeDocumentListResponse extends Omit<components['schemas']['Go_internal_module_ai_knowledge_DocumentListResponse_Output'], 'list'> {
  list: AiKnowledgeDocumentItem[]
}

export interface AiKnowledgeDocumentMutationParams {
  id?: Id
  knowledge_base_id?: Id
  title: string
  source_type: AiKnowledgeSourceType
  source_ref: string
  content: string
  status: AiKnowledgeStatus
}

export interface AiKnowledgeDocumentMutationBody {
  title: string
  source_type: AiKnowledgeSourceType
  source_ref: string
  content: string
  status: AiKnowledgeStatus
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
