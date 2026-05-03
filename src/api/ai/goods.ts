import { legacyRequest } from '@/lib/http'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

export interface GoodsMetaRecord extends Record<string, unknown> {
  price?: string | number
  originalPrice?: string | number
  sales?: string | number
  brand?: string
  shop?: string
  specs?: string | string[]
  description?: string
  reviews?: string
}

export interface GoodsInitResponse {
  dict: {
    goods_platform_arr: DictOption<number>[]
    goods_status_arr: DictOption<number>[]
    goods_agent_list: DictOption<number>[]
    goods_voice_arr: DictOption<string>[]
    goods_emotion_arr: DictOption<string>[]
  }
}

export interface GoodsStatusCountItem {
  label: string
  value: number | ''
  num: number
}

export interface GoodsListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  title?: string
  platform?: number | ''
  status?: number | ''
}

export interface GoodsStatusCountParams extends RequestPayload {
  title?: string
  platform?: number | ''
}

export interface GoodsItem {
  id: number
  title: string
  main_img?: string | null
  platform: number
  platform_name: string
  link?: string | null
  tips?: string | null
  ocr?: string | null
  point?: string | null
  script_text?: string | null
  model_origin?: string | null
  status: number
  status_name: string
  status_msg?: string | null
  image_list?: string[] | null
  image_list_success?: string[] | null
  audio_url?: string | null
  srt_url?: string | null
  meta?: GoodsMetaRecord | null
  created_at: string
  updated_at: string
}

export interface GoodsMutationParams extends RequestPayload {
  id: number
  title?: string
  main_img?: string | null
  link?: string | null
  tips?: string | null
  point?: string | null
  script_text?: string | null
  image_list?: string[]
  image_list_success?: string[]
  meta?: Record<string, string> | null
}

export interface GoodsAddParams extends RequestPayload {
  title?: string
  main_img?: string
  platform?: number
  link?: string
  image_list?: string[]
}

export interface GoodsSubmitParams extends RequestPayload {
  images: string[]
  title?: string
  platform?: string
  link?: string
  meta?: GoodsMetaRecord
}

export interface GoodsOcrParams extends RequestPayload {
  id: number
  image_list_success?: string[]
}

export interface GoodsGenerateParams extends RequestPayload {
  id: number
  agent_id: number
  tips?: string
}

export interface GoodsTtsParams extends RequestPayload {
  id: number
  voice?: string
  emotion?: string
  script_text?: string
}

export const GoodsApi = {
  init: (params?: RequestPayload) => legacyRequest.post<GoodsInitResponse>('/api/admin/Goods/init', params),
  statusCount: (params?: GoodsStatusCountParams) => legacyRequest.post<GoodsStatusCountItem[]>('/api/admin/Goods/statusCount', params),
  list: (params: GoodsListParams) => legacyRequest.post<PaginatedResponse<GoodsItem>>('/api/admin/Goods/list', params),
  add: (params: GoodsAddParams) => legacyRequest.post<{ id: number }>('/api/admin/Goods/add', params),
  edit: (params: GoodsMutationParams) => legacyRequest.post<void>('/api/admin/Goods/edit', params),
  del: (params: { id: Id | Id[] }) => legacyRequest.post<{ affected: number }>('/api/admin/Goods/del', params),
  submit: (params: GoodsSubmitParams) => legacyRequest.post<{ id: number }>('/api/admin/Goods/submit', params),
  ocr: (params: GoodsOcrParams) => legacyRequest.post<{ msg: string }>('/api/admin/Goods/ocr', params),
  generate: (params: GoodsGenerateParams) => legacyRequest.post<{ msg: string }>('/api/admin/Goods/generate', params),
  tts: (params: GoodsTtsParams) => legacyRequest.post<{ msg: string }>('/api/admin/Goods/tts', params),
}
