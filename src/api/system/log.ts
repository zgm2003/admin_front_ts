import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption } from '@/types/common'

export interface SystemLogInitResponse {
  dict: {
    log_level_arr: DictOption<SystemLogLevel>[]
    log_tail_arr: DictOption<number>[]
  }
}

export type SystemLogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

export interface SystemLogFileItem {
  name: string
  size: number
  size_human: string
  mtime: string
}

export interface SystemLogFilesResponse {
  list: SystemLogFileItem[]
}

export interface SystemLogLineItem {
  number: number
  level: SystemLogLevel | ''
  content: string
}

export interface SystemLogLinesParams {
  filename: string
  keyword?: string
  level?: SystemLogLevel | ''
  tail?: number
}

export interface SystemLogLinesResponse {
  lines: SystemLogLineItem[]
  total: number
  filename: string
}

const BASE = `${ADMIN_API_PREFIX}/system-logs`

export const SystemLogApi = {
  init: () => request.get<SystemLogInitResponse>(`${BASE}/init`),
  files: () => request.get<SystemLogFilesResponse>(`${BASE}/files`),
  lines: ({ filename, keyword, level, tail }: SystemLogLinesParams) => request.get<SystemLogLinesResponse>(`${BASE}/files/${encodeURIComponent(filename)}/lines`, {
    params: {
      keyword: keyword || undefined,
      level: level || undefined,
      tail,
    },
  }),
}
