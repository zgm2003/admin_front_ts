import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { DictOption } from '@/types/common'

export type SystemLogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

export interface SystemLogInitResponse {
  dict: {
    log_level_arr: DictOption<SystemLogLevel>[]
    log_tail_arr: DictOption<number>[]
  }
}

export type SystemLogFileItem = components['schemas']['Go_internal_module_systemlog_FileItem_Output']

export type SystemLogFilesResponse = components['schemas']['Go_internal_module_systemlog_FilesResponse_Output']

export type SystemLogLineItem = components['schemas']['Go_internal_module_systemlog_LineItem_Output']

export interface SystemLogLinesParams {
  filename: string
  keyword?: string
  level?: SystemLogLevel | ''
  tail?: number
}

export type SystemLogLinesResponse = components['schemas']['Go_internal_module_systemlog_LinesResponse_Output']
type SystemLogLinesQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_system_logs_files_name_lines'>['query']>

function isSystemLogLevel(value: string): value is SystemLogLevel {
  return value === 'DEBUG' || value === 'INFO' || value === 'WARNING' || value === 'ERROR' || value === 'CRITICAL'
}

const pageInit = async (options: ExecuteOptions = {}): Promise<SystemLogInitResponse> => {
  const response = await executeAdminOperation(adminOperations.get_api_admin_v1_system_logs_page_init, {}, options)
  const logLevelArr = response.dict.log_level_arr.map((option) => {
    if (!isSystemLogLevel(option.value)) throw new Error('system log level dictionary violates the filter contract')
    return { label: option.label, value: option.value }
  })
  return {
    dict: {
      log_level_arr: logLevelArr,
      log_tail_arr: response.dict.log_tail_arr,
    },
  }
}

export const SystemLogApi = {
  pageInit,
  files: (options: ExecuteOptions = {}): Promise<SystemLogFilesResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_system_logs_files, {}, options),
  lines: ({ filename, keyword, level, tail }: SystemLogLinesParams, options: ExecuteOptions = {}): Promise<SystemLogLinesResponse> => {
    const query: SystemLogLinesQuery = {}
    if (keyword) query.keyword = keyword
    if (level) query.level = level
    if (tail !== undefined) query.tail = tail
    return executeAdminOperation(adminOperations.get_api_admin_v1_system_logs_files_name_lines, {
      path: { name: filename },
      query,
    }, options)
  },
}
