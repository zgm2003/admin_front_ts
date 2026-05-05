import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, PaginatedResponse } from '@/types/common'

export interface PayChannelInitResponse {
  dict: {
    channel_arr: DictOption<number>[]
    common_status_arr: DictOption<number>[]
    pay_method_arr: DictOption<string>[]
  }
}

export interface PayChannelListParams {
  current_page: number
  page_size: number
  name?: string
  channel?: number | ''
  status?: number | ''
}

interface PayChannelListQueryParams {
  current_page: number
  page_size: number
  name?: string
  channel?: number
  status?: number
}

export interface PayChannelListItem {
  id: number
  name: string
  channel: number
  channel_name: string
  supported_methods: string[]
  supported_methods_text: string
  mch_id: string
  app_id: string
  notify_url: string
  app_private_key_hint: string
  public_cert_path: string
  platform_cert_path: string
  root_cert_path: string
  sort: number
  is_sandbox: number
  is_sandbox_text: string
  status: number
  status_name: string
  remark: string
  created_at: string
  updated_at: string
}

export interface PayChannelCreatePayload {
  name: string
  channel: number
  supported_methods: string[]
  mch_id: string
  app_id: string
  notify_url: string
  app_private_key?: string
  public_cert_path: string
  platform_cert_path: string
  root_cert_path: string
  sort: number
  is_sandbox: number
  status: number
  remark: string
}

export interface PayChannelCreateResponse {
  id: number
}

export type PayChannelUpdatePayload = PayChannelCreatePayload

export interface PayChannelMutationPayload extends PayChannelCreatePayload {
  id?: number
  app_private_key_hint?: string
}

export interface PayChannelDeleteParams {
  id: number
}

export interface PayChannelStatusParams {
  id: number
  status: number
}

export interface PayChannelStatusBody {
  status: number
}

function normalizeListParams(params: PayChannelListParams): PayChannelListQueryParams {
  const query: PayChannelListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (params.name) {
    query.name = params.name
  }
  if (typeof params.channel === 'number') {
    query.channel = params.channel
  }
  if (typeof params.status === 'number') {
    query.status = params.status
  }

  return query
}

function positiveID(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('pay channel id must be a positive integer')
  }
  return value
}

function mutationBody(params: PayChannelMutationPayload): PayChannelCreatePayload {
  return {
    name: params.name,
    channel: params.channel,
    supported_methods: params.supported_methods,
    mch_id: params.mch_id,
    app_id: params.app_id,
    notify_url: params.notify_url,
    ...(params.app_private_key ? { app_private_key: params.app_private_key } : {}),
    public_cert_path: params.public_cert_path,
    platform_cert_path: params.platform_cert_path,
    root_cert_path: params.root_cert_path,
    sort: params.sort,
    is_sandbox: params.is_sandbox,
    status: params.status,
    remark: params.remark,
  }
}

export const PayChannelApi = {
  init: () => request.get<PayChannelInitResponse>(`${ADMIN_API_PREFIX}/pay-channels/page-init`),
  list: (params: PayChannelListParams) => request.get<PaginatedResponse<PayChannelListItem>>(`${ADMIN_API_PREFIX}/pay-channels`, { params: normalizeListParams(params) }),
  add: (params: PayChannelMutationPayload) => request.post<PayChannelCreateResponse, PayChannelCreatePayload>(`${ADMIN_API_PREFIX}/pay-channels`, mutationBody(params)),
  edit: (params: PayChannelMutationPayload) => {
    const id = positiveID(params.id ?? 0)
    return request.put<void, PayChannelUpdatePayload>(`${ADMIN_API_PREFIX}/pay-channels/${id}`, mutationBody(params))
  },
  del: (params: PayChannelDeleteParams) => request.delete<void>(`${ADMIN_API_PREFIX}/pay-channels/${params.id}`),
  status: (params: PayChannelStatusParams) => {
    const id = positiveID(params.id)
    const body: PayChannelStatusBody = { status: params.status }
    return request.patch<void, PayChannelStatusBody>(`${ADMIN_API_PREFIX}/pay-channels/${id}/status`, body)
  },
}
