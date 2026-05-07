import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, PaginatedResponse } from '@/types/common'

export interface PayReconcileInitResponse {
  dict: {
    channel_arr: DictOption<number>[]
    reconcile_status_arr: DictOption<number>[]
    bill_type_arr: DictOption<number>[]
  }
}

export interface PayReconcileListParams {
  current_page: number
  page_size: number
  channel?: number | ''
  status?: number | ''
  bill_type?: number | ''
  start_date?: string
  end_date?: string
}

interface PayReconcileListQueryParams {
  current_page: number
  page_size: number
  channel?: number
  status?: number
  bill_type?: number
  start_date?: string
  end_date?: string
}

export interface PayReconcileTaskItem {
  id: number
  reconcile_date: string
  channel: number
  channel_text: string
  bill_type: number
  bill_type_text: string
  status: number
  status_text: string
  platform_count: number
  platform_amount: number
  local_count: number
  local_amount: number
  diff_count: number
  diff_amount: number
  started_at?: string | null
  finished_at?: string | null
  created_at: string
}

export interface PayReconcileDetailResponse {
  task: PayReconcileTaskItem & {
    channel_id: number
    platform_file_url: string
    local_file_url: string
    diff_file_url: string
    error_msg?: string
  }
}

export interface PayReconcileDownloadResponse {
  url: string
  filename: string
}

function trimOptional(value: string | undefined): string | undefined {
  const next = value?.trim()
  return next ? next : undefined
}

function normalizeListParams(params: PayReconcileListParams): PayReconcileListQueryParams {
  const query: PayReconcileListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (typeof params.channel === 'number') {
    query.channel = params.channel
  }
  if (typeof params.status === 'number') {
    query.status = params.status
  }
  if (typeof params.bill_type === 'number') {
    query.bill_type = params.bill_type
  }
  const startDate = trimOptional(params.start_date)
  if (startDate) {
    query.start_date = startDate
  }
  const endDate = trimOptional(params.end_date)
  if (endDate) {
    query.end_date = endDate
  }

  return query
}

export const PayReconcileApi = {
  init: () => request.get<PayReconcileInitResponse>(`${ADMIN_API_PREFIX}/pay-reconcile-tasks/page-init`),
  list: (params: PayReconcileListParams) => request.get<PaginatedResponse<PayReconcileTaskItem>>(`${ADMIN_API_PREFIX}/pay-reconcile-tasks`, { params: normalizeListParams(params) }),
  detail: (params: { id: number }) => request.get<PayReconcileDetailResponse>(`${ADMIN_API_PREFIX}/pay-reconcile-tasks/${params.id}`),
  retry: (params: { id: number }) => request.patch<void>(`${ADMIN_API_PREFIX}/pay-reconcile-tasks/${params.id}/retry`),
  download: (params: { id: number; type: 'platform' | 'local' | 'diff' }) => request.get<PayReconcileDownloadResponse>(`${ADMIN_API_PREFIX}/pay-reconcile-tasks/${params.id}/files/${params.type}`),
}
