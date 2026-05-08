import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse } from '@/types/common'

export interface AiModelInitResponse {
  dict: {
    ai_driver_arr: DictOption<string>[]
    common_status_arr: DictOption<number>[]
  }
}

export interface AiModelListParams {
  current_page?: number
  page_size?: number
  name?: string
  driver?: string
  status?: number | ''
}

interface AiModelListQueryParams {
  current_page?: number
  page_size?: number
  name?: string
  driver?: string
  status?: number
}

export interface AiModelItem {
  id: number
  name: string
  driver: string
  driver_name: string
  model_code: string
  endpoint?: string | null
  api_key_hint?: string | null
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiModelMutationBody {
  name: string
  driver: string
  model_code: string
  endpoint?: string | null
  api_key?: string
  status?: number
}

export interface AiModelMutationParams extends AiModelMutationBody {
  id?: number
}

export interface AiModelCreateResponse {
  id: number
}

export interface AiModelStatusBody {
  status: number
}

function normalizeListParams(params: AiModelListParams): AiModelListQueryParams {
  const query: AiModelListQueryParams = {}

  if (typeof params.current_page === 'number') {
    query.current_page = params.current_page
  }
  if (typeof params.page_size === 'number') {
    query.page_size = params.page_size
  }
  if (params.name) {
    query.name = params.name
  }
  if (params.driver) {
    query.driver = params.driver
  }
  if (typeof params.status === 'number') {
    query.status = params.status
  }

  return query
}

function positiveID(value: Id | number): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('AI model id must be a positive integer')
  }
  return id
}

function mutationBody(params: AiModelMutationParams): AiModelMutationBody {
  return {
    name: params.name,
    driver: params.driver,
    model_code: params.model_code,
    endpoint: params.endpoint ?? null,
    ...(params.api_key ? { api_key: params.api_key } : {}),
    ...(typeof params.status === 'number' ? { status: params.status } : {}),
  }
}

function deleteModel(id: number): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-models/${id}`)
}

export const AiModelApi = {
  init: () => request.get<AiModelInitResponse>(`${ADMIN_API_PREFIX}/ai-models/page-init`),
  list: (params: AiModelListParams) => request.get<PaginatedResponse<AiModelItem>>(`${ADMIN_API_PREFIX}/ai-models`, { params: normalizeListParams(params) }),
  add: (params: AiModelMutationParams) => request.post<AiModelCreateResponse, AiModelMutationBody>(`${ADMIN_API_PREFIX}/ai-models`, mutationBody(params)),
  edit: (params: AiModelMutationParams) => {
    const id = positiveID(params.id ?? 0)
    return request.put<void, AiModelMutationBody>(`${ADMIN_API_PREFIX}/ai-models/${id}`, mutationBody(params))
  },
  del: async (params: { id: Id | Id[] }): Promise<void> => {
    const ids = Array.isArray(params.id) ? params.id : [params.id]
    await Promise.all(ids.map((item) => deleteModel(positiveID(item))))
  },
  status: (params: { id: Id; status: number }) => {
    const id = positiveID(params.id)
    const body: AiModelStatusBody = { status: params.status }
    return request.patch<void, AiModelStatusBody>(`${ADMIN_API_PREFIX}/ai-models/${id}/status`, body)
  },
}
