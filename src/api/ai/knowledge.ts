import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { Id } from '@/types/common'

export * from './knowledge.types'

import type {
  AiKnowledgeBaseContract,
  AiKnowledgeBaseItem,
  AiKnowledgeBaseListResponse,
  AiKnowledgeBaseMutationBody,
  AiKnowledgeBaseMutationParams,
  AiKnowledgeChunkListResponse,
  AiKnowledgeCreateResponse,
  AiKnowledgeDocumentContract,
  AiKnowledgeDocumentDetail,
  AiKnowledgeDocumentItem,
  AiKnowledgeDocumentListParams,
  AiKnowledgeDocumentListResponse,
  AiKnowledgeDocumentMutationBody,
  AiKnowledgeDocumentMutationParams,
  AiKnowledgeIndexStatus,
  AiKnowledgeInitResponse,
  AiKnowledgeListParams,
  AiKnowledgeRetrievalTestBody,
  AiKnowledgeRetrievalTestParams,
  AiKnowledgeRetrievalTestResponse,
  AiKnowledgeSourceType,
  AiKnowledgeStatus,
} from './knowledge.types'

type AiKnowledgeListQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_ai_knowledge_bases'>['query']>
type AiKnowledgeDocumentListQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_ai_knowledge_bases_id_documents'>['query']>

function positiveID(value: Id | number, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
  return value
}

function isKnowledgeStatus(value: number): value is AiKnowledgeStatus {
  return value === 1 || value === 2
}

function isSourceType(value: string): value is AiKnowledgeSourceType {
  return value === 'text' || value === 'markdown' || value === 'file'
}

function isIndexStatus(value: string): value is AiKnowledgeIndexStatus {
  return value === 'pending' || value === 'indexed' || value === 'failed'
}

function toKnowledgeBase(item: AiKnowledgeBaseContract): AiKnowledgeBaseItem {
  if (!isKnowledgeStatus(item.status)) throw new Error('AI knowledge base status violates the editable contract')
  return { ...item, status: item.status }
}

function toKnowledgeDocument(item: AiKnowledgeDocumentContract): AiKnowledgeDocumentItem {
  if (!isSourceType(item.source_type) || !isIndexStatus(item.index_status) || !isKnowledgeStatus(item.status)) {
    throw new Error('AI knowledge document violates the editable contract')
  }
  return {
    ...item,
    source_type: item.source_type,
    index_status: item.index_status,
    status: item.status,
  }
}

function toKnowledgeDetail(
  item: components['schemas']['Go_internal_module_ai_knowledge_DocumentDetailResponse_Output'],
): AiKnowledgeDocumentDetail {
  const document = toKnowledgeDocument(item)
  return { ...document, content: item.content }
}

function toKnowledgeInit(
  response: components['schemas']['Go_internal_module_ai_knowledge_InitResponse_Output'],
): AiKnowledgeInitResponse {
  const statuses = response.dict.common_status_arr.map((option) => {
    if (!isKnowledgeStatus(option.value)) throw new Error('AI knowledge status dictionary violates the contract')
    return { label: option.label, value: option.value }
  })
  const sources = response.dict.source_type_arr.map((option) => {
    if (!isSourceType(option.value)) throw new Error('AI knowledge source dictionary violates the contract')
    return { label: option.label, value: option.value }
  })
  const indexes = response.dict.index_status_arr.map((option) => {
    if (!isIndexStatus(option.value)) throw new Error('AI knowledge index dictionary violates the contract')
    return { label: option.label, value: option.value }
  })
  return { dict: { common_status_arr: statuses, source_type_arr: sources, index_status_arr: indexes } }
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

function requiredID(value: Id | undefined, label: string): number {
  if (value === undefined) throw new Error(`${label} must be provided`)
  return positiveID(value, label)
}

async function deleteBase(id: Id, options: ExecuteOptions = {}): Promise<void> {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_ai_knowledge_bases_id, {
    path: { id: positiveID(id, 'AI knowledge base id') },
  }, options)
}

const pageInit = async (options: ExecuteOptions = {}): Promise<AiKnowledgeInitResponse> => {
  const response = await executeAdminOperation(adminOperations.get_api_admin_v1_ai_knowledge_bases_page_init, {}, options)
  return toKnowledgeInit(response)
}
const create = (params: AiKnowledgeBaseMutationParams, options: ExecuteOptions = {}): Promise<AiKnowledgeCreateResponse> =>
  executeAdminOperation(adminOperations.post_api_admin_v1_ai_knowledge_bases, { body: baseBody(params) }, options)
const update = async (params: AiKnowledgeBaseMutationParams, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.put_api_admin_v1_ai_knowledge_bases_id, {
    path: { id: requiredID(params.id, 'AI knowledge base id') },
    body: baseBody(params),
  }, options)
}
const changeStatus = async (params: { id: Id; status: AiKnowledgeStatus }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.patch_api_admin_v1_ai_knowledge_bases_id_status, {
    path: { id: positiveID(params.id, 'AI knowledge base id') },
    body: { status: params.status },
  }, options)
}
const deleteOne = (params: { id: Id }, options: ExecuteOptions = {}) => deleteBase(params.id, options)
const deleteBatch = async (params: { ids: Id[] }, options: ExecuteOptions = {}) => {
  if (params.ids.length === 0) throw new Error('AI knowledge base ids must not be empty')
  await Promise.all(params.ids.map((item) => deleteOne({ id: item }, options)))
}
const createDocument = (params: AiKnowledgeDocumentMutationParams, options: ExecuteOptions = {}): Promise<AiKnowledgeCreateResponse> =>
  executeAdminOperation(adminOperations.post_api_admin_v1_ai_knowledge_bases_id_documents, {
    path: { id: requiredID(params.knowledge_base_id, 'AI knowledge base id') },
    body: documentBody(params),
  }, options)
const updateDocument = async (params: AiKnowledgeDocumentMutationParams, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.put_api_admin_v1_ai_knowledge_documents_id, {
    path: { id: requiredID(params.id, 'AI knowledge document id') },
    body: documentBody(params),
  }, options)
}

export const AiKnowledgeApi = {
  pageInit,
  list: async (params: AiKnowledgeListParams, options: ExecuteOptions = {}): Promise<AiKnowledgeBaseListResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_ai_knowledge_bases, {
      query: normalizeListParams(params),
    }, options)
    return { list: response.list.map(toKnowledgeBase), page: response.page }
  },
  detail: async (params: { id: Id }, options: ExecuteOptions = {}): Promise<AiKnowledgeBaseItem> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_ai_knowledge_bases_id, {
      path: { id: positiveID(params.id, 'AI knowledge base id') },
    }, options)
    return toKnowledgeBase(response)
  },
  create,
  update,
  changeStatus,
  deleteOne,
  deleteBatch,
  documents: async (params: { knowledge_base_id: Id } & AiKnowledgeDocumentListParams, options: ExecuteOptions = {}): Promise<AiKnowledgeDocumentListResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_ai_knowledge_bases_id_documents, {
      path: { id: positiveID(params.knowledge_base_id, 'AI knowledge base id') },
      query: normalizeDocumentListParams(params),
    }, options)
    return { list: response.list.map(toKnowledgeDocument), page: response.page }
  },
  documentDetail: async (params: { id: Id }, options: ExecuteOptions = {}): Promise<AiKnowledgeDocumentDetail> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_ai_knowledge_documents_id, {
      path: { id: positiveID(params.id, 'AI knowledge document id') },
    }, options)
    return toKnowledgeDetail(response)
  },
  createDocument,
  updateDocument,
  addDocument: createDocument,
  editDocument: updateDocument,
  async documentStatus(params: { id: Id; status: AiKnowledgeStatus }, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.patch_api_admin_v1_ai_knowledge_documents_id_status, {
      path: { id: positiveID(params.id, 'AI knowledge document id') },
      body: { status: params.status },
    }, options)
  },
  async deleteDocument(params: { id: Id }, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.delete_api_admin_v1_ai_knowledge_documents_id, {
      path: { id: positiveID(params.id, 'AI knowledge document id') },
    }, options)
  },
  async reindexDocument(params: { id: Id }, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.post_api_admin_v1_ai_knowledge_documents_id_reindex, {
      path: { id: positiveID(params.id, 'AI knowledge document id') },
    }, options)
  },
  chunks: (params: { id: Id }, options: ExecuteOptions = {}): Promise<AiKnowledgeChunkListResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_ai_knowledge_documents_id_chunks, {
      path: { id: positiveID(params.id, 'AI knowledge document id') },
    }, options),
  retrievalTest: (params: AiKnowledgeRetrievalTestParams, options: ExecuteOptions = {}): Promise<AiKnowledgeRetrievalTestResponse> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_ai_knowledge_bases_id_retrieval_tests, {
      path: { id: positiveID(params.knowledge_base_id, 'AI knowledge base id') },
      body: retrievalTestBody(params),
    }, options),
}
