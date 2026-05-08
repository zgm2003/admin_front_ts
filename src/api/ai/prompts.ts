import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { Id, PaginatedResponse } from '@/types/common'

export interface AiPromptListParams {
  current_page?: number
  page_size?: number
  title?: string
  category?: string
  is_favorite?: number | ''
}

interface AiPromptListQueryParams {
  current_page?: number
  page_size?: number
  title?: string
  category?: string
  is_favorite?: number
}

export interface AiPromptItem {
  id: number
  title: string
  content: string
  category?: string | null
  tags: string[]
  variables: string[]
  is_favorite: number
  use_count: number
  sort: number
  created_at: string
}

export type AiPromptDetailResponse = Omit<AiPromptItem, 'created_at'>

export interface AiPromptMutationBody {
  title: string
  content: string
  category?: string | null
  tags?: string[]
  variables?: string[]
}

export interface AiPromptMutationParams extends AiPromptMutationBody {
  id?: number
}

export interface AiPromptCreateResponse {
  id: number
}

function normalizeListParams(params: AiPromptListParams = {}): AiPromptListQueryParams {
  const query: AiPromptListQueryParams = {}

  if (typeof params.current_page === 'number') {
    query.current_page = params.current_page
  }
  if (typeof params.page_size === 'number') {
    query.page_size = params.page_size
  }
  if (params.title) {
    query.title = params.title
  }
  if (params.category) {
    query.category = params.category
  }
  if (typeof params.is_favorite === 'number') {
    query.is_favorite = params.is_favorite
  }

  return query
}

function positiveID(value: Id | number): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('AI prompt id must be a positive integer')
  }
  return id
}

function mutationBody(params: AiPromptMutationParams): AiPromptMutationBody {
  return {
    title: params.title,
    content: params.content,
    category: params.category ?? null,
    ...(params.tags ? { tags: params.tags } : {}),
    ...(params.variables ? { variables: params.variables } : {}),
  }
}

function deletePrompt(id: number): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-prompts/${id}`)
}

export const AiPromptApi = {
  list: (params?: AiPromptListParams) => request.get<PaginatedResponse<AiPromptItem>>(`${ADMIN_API_PREFIX}/ai-prompts`, { params: normalizeListParams(params) }),
  detail: (params: { id: number }) => {
    const id = positiveID(params.id)
    return request.get<AiPromptDetailResponse>(`${ADMIN_API_PREFIX}/ai-prompts/${id}`)
  },
  add: (params: AiPromptMutationParams) => request.post<AiPromptCreateResponse, AiPromptMutationBody>(`${ADMIN_API_PREFIX}/ai-prompts`, mutationBody(params)),
  edit: (params: AiPromptMutationParams) => {
    const id = positiveID(params.id ?? 0)
    return request.put<void, AiPromptMutationBody>(`${ADMIN_API_PREFIX}/ai-prompts/${id}`, mutationBody(params))
  },
  del: async (params: { id: Id | Id[] }): Promise<void> => {
    const ids = Array.isArray(params.id) ? params.id : [params.id]
    await Promise.all(ids.map((item) => deletePrompt(positiveID(item))))
  },
  toggleFavorite: (params: { id: number }) => {
    const id = positiveID(params.id)
    return request.patch<{ is_favorite: number }>(`${ADMIN_API_PREFIX}/ai-prompts/${id}/favorite`)
  },
  use: (params: { id: number }) => {
    const id = positiveID(params.id)
    return request.post<{ content: string }>(`${ADMIN_API_PREFIX}/ai-prompts/${id}/use`)
  },
}
