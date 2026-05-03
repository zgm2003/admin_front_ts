import { legacyRequest } from '@/lib/http'
import type { DictOption, RequestPayload } from '@/types/common'

export interface SystemLogInitResponse {
  dict: {
    log_level_arr: DictOption<string>[]
    log_tail_arr: DictOption<number>[]
  }
}

export interface SystemLogFileItem {
  name: string
  size: number
  size_human: string
  mtime: string
}

export interface SystemLogFilesResponse {
  list: SystemLogFileItem[]
}

export interface SystemLogContentParams extends RequestPayload {
  filename: string
  keyword?: string
  level?: string
  tail?: number
}

export interface SystemLogContentResponse {
  lines: string[]
  total: number
  filename: string
}

export const SystemLogApi = {
  init: (params?: RequestPayload) => legacyRequest.post<SystemLogInitResponse>('/api/admin/SystemLog/init', params),
  files: (params?: RequestPayload) => legacyRequest.post<SystemLogFilesResponse>('/api/admin/SystemLog/files', params),
  content: (params: SystemLogContentParams) => legacyRequest.post<SystemLogContentResponse>('/api/admin/SystemLog/content', params),
}
