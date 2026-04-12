import request from '@/utils/request'
import type { DictOption, PaginatedResponse } from '@/types/common'

export interface PayChannelInitResponse {
  dict: {
    channel_arr: DictOption<number>[]
    common_status_arr: DictOption<number>[]
    pay_method_arr: DictOption<string>[]
  }
}

export interface PayChannelListParams extends Record<string, unknown> {
  current_page: number
  page_size: number
  name?: string
  channel?: number | ''
  status?: number | ''
}

export interface PayChannelListItem {
  id: number
  name: string
  channel: number
  channel_name: string
  supported_methods?: string[]
  supported_methods_text?: string
  mch_id: string
  app_id?: string
  notify_url?: string
  app_private_key_hint?: string
  public_cert_path?: string
  platform_cert_path?: string
  root_cert_path?: string
  sort?: number
  is_sandbox: number
  is_sandbox_text?: string
  status: number
  status_name: string
  remark?: string
  created_at?: string
}

export interface PayChannelMutationPayload {
  id?: number
  name: string
  channel: number
  supported_methods: string[]
  mch_id: string
  app_id: string
  notify_url: string
  app_private_key?: string
  app_private_key_hint?: string
  public_cert_path: string
  platform_cert_path: string
  root_cert_path: string
  sort: number
  is_sandbox: number
  status: number
  remark: string
}

export interface PayChannelDeleteParams {
  id: number | number[]
}

export interface PayChannelStatusParams {
  id: number
  status: number
}

export const PayChannelApi = {
  init: (params?: Record<string, unknown>) => request.post<PayChannelInitResponse>('/api/admin/PayChannel/init', params),
  list: (params: PayChannelListParams) => request.post<PaginatedResponse<PayChannelListItem>>('/api/admin/PayChannel/list', params),
  add: (params: PayChannelMutationPayload) => request.post<unknown>('/api/admin/PayChannel/add', params),
  edit: (params: PayChannelMutationPayload) => request.post<unknown>('/api/admin/PayChannel/edit', params),
  del: (params: PayChannelDeleteParams) => request.post<unknown>('/api/admin/PayChannel/del', params),
  status: (params: PayChannelStatusParams) => request.post<unknown>('/api/admin/PayChannel/status', params),
}
