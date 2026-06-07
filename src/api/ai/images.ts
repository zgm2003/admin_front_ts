import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse } from '@/types/common'

export type AiImageTaskStatus = 'pending' | 'running' | 'success' | 'failed'
export type AiImageSize = 'auto' | '1024x1024' | '1536x1024' | '1024x1536'
export type AiImageQuality = 'auto' | 'low' | 'medium' | 'high'
export type AiImageStorageProvider = 'cos' | 'remote_url'
export type AiImageFileRole = 'input' | 'mask' | 'output'

export interface AiImageAgentOption {
  id: number
  name: string
  avatar?: string | null
}

export interface AiImageInitResponse {
  dict: {
    size_arr: DictOption<AiImageSize>[]
    quality_arr: DictOption<AiImageQuality>[]
    status_arr: DictOption<AiImageTaskStatus>[]
  }
  agent_options: AiImageAgentOption[]
}

export interface AiImageTaskItem {
  id: number
  agent_id: number
  agent_name_snapshot: string
  provider_id_snapshot: number
  provider_name_snapshot: string
  model_id_snapshot: string
  model_display_name_snapshot: string
  prompt: string
  size: AiImageSize | string
  quality: AiImageQuality | string
  n: number
  status: AiImageTaskStatus
  status_name?: string
  error_message?: string
  actual_params_json?: Record<string, unknown>
  finished_at?: string
  elapsed_ms: number
  created_at: string
  updated_at: string
}

export interface AiImageFileItem {
  id: number
  task_id: number
  role: AiImageFileRole
  sort_order: number
  storage_provider: AiImageStorageProvider
  storage_key: string
  storage_url: string
  mime_type: string
  width: number
  height: number
  size_bytes: number
  related_file_id?: number | null
  revised_prompt?: string
  created_at: string
}

export interface AiImageDetailResponse {
  task: AiImageTaskItem
  inputs: AiImageFileItem[]
  mask?: AiImageFileItem | null
  outputs: AiImageFileItem[]
}

export interface AiImageListParams {
  current_page: number
  page_size: number
  status?: AiImageTaskStatus | ''
}

export interface AiImageFileInput {
  storage_provider: AiImageStorageProvider
  storage_key: string
  storage_url: string
  mime_type: string
  width: number
  height: number
  size_bytes: number
}

export type AiImageMaskFileInput = AiImageFileInput & {
  related_sort_order: number
}

export interface AiImageTaskCreatePayload {
  agent_id: number
  prompt: string
  size?: AiImageSize | ''
  quality?: AiImageQuality | ''
  n?: number
  input_files?: AiImageFileInput[]
  mask_file?: AiImageMaskFileInput | null
}

export interface AiImageCreateTaskResponse {
  task: AiImageTaskItem
}

interface AiImageListQueryParams {
  current_page: number
  page_size: number
  status?: AiImageTaskStatus
}

const BASE = `${ADMIN_API_PREFIX}/ai-images`

function positiveID(value: Id | number, label: string): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} must be a positive integer`)
  return id
}

function optionalImageEnum<T extends string>(value: T | '' | undefined): T | undefined {
  if (value === undefined) {
    return undefined
  }
  if (value === '') {
    return undefined
  }
  return value
}

function normalizeListParams(params: AiImageListParams): AiImageListQueryParams {
  const query: AiImageListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }
  if (params.status) query.status = params.status
  return query
}

function normalizeTaskPayload(payload: AiImageTaskCreatePayload): AiImageTaskCreatePayload {
  const body: AiImageTaskCreatePayload = {
    agent_id: positiveID(payload.agent_id, 'AI image agent id'),
    prompt: payload.prompt.trim(),
    size: optionalImageEnum(payload.size),
    quality: optionalImageEnum(payload.quality),
    n: payload.n,
    input_files: payload.input_files,
    mask_file: payload.mask_file,
  }
  return body
}

function deleteTask(id: number): Promise<void> {
  return request.delete<void>(`${BASE}/${id}`)
}

const pageInit = () => request.get<AiImageInitResponse>(`${BASE}/page-init`)
const createTask = (payload: AiImageTaskCreatePayload) => request.post<AiImageCreateTaskResponse, AiImageTaskCreatePayload>(BASE, normalizeTaskPayload(payload))
const deleteOne = (params: { id: Id }) => deleteTask(positiveID(params.id, 'AI image task id'))
const deleteBatch = async (params: { ids: Id[] }): Promise<void> => {
  await Promise.all(params.ids.map((item) => deleteOne({ id: item })))
}

export const AiImageApi = {
  pageInit,
  list: (params: AiImageListParams) => request.get<PaginatedResponse<AiImageTaskItem>>(BASE, { params: normalizeListParams(params) }),
  detail: (params: { id: Id }) => request.get<AiImageDetailResponse>(`${BASE}/${positiveID(params.id, 'AI image task id')}`),
  createTask,
  deleteOne,
  deleteBatch,
  addTask: createTask,
}
