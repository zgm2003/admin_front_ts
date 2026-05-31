import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse } from '@/types/common'

export type AiBillingUnit = 'request' | 'image' | 'second'
export type AiBillingScene = 'admin_image_generate' | 'canvas_text_generate' | 'canvas_image_generate' | 'canvas_video_generate'

export interface AiBillingRulePageInitResponse {
  dict: {
    scene_arr: DictOption<AiBillingScene>[]
    unit_arr: DictOption<AiBillingUnit>[]
    common_status_arr: DictOption<number>[]
  }
}

export interface AiBillingRuleItem {
  id: number
  scene: AiBillingScene
  scene_name: string
  unit: AiBillingUnit
  unit_name: string
  unit_price_cents: number
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiBillingRuleMutationParams {
  id?: Id
  scene: AiBillingScene
  unit: AiBillingUnit
  unit_price_cents: number
  status: number
}

export interface AiBillingRuleCreateBody {
  scene: AiBillingScene
  unit: AiBillingUnit
  unit_price_cents: number
  status: number
}

export interface AiBillingRuleUpdateBody {
  unit: AiBillingUnit
  unit_price_cents: number
  status: number
}

function positiveID(value: Id | number, label: string): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} must be a positive integer`)
  return id
}

function createBody(params: AiBillingRuleMutationParams): AiBillingRuleCreateBody {
  return {
    scene: params.scene,
    unit: params.unit,
    unit_price_cents: params.unit_price_cents,
    status: params.status,
  }
}

function updateBody(params: AiBillingRuleMutationParams): AiBillingRuleUpdateBody {
  return {
    unit: params.unit,
    unit_price_cents: params.unit_price_cents,
    status: params.status,
  }
}

const pageInit = () => request.get<AiBillingRulePageInitResponse>(`${ADMIN_API_PREFIX}/ai-billing-rules/page-init`)
const list = () => request.get<PaginatedResponse<AiBillingRuleItem>>(`${ADMIN_API_PREFIX}/ai-billing-rules`, { params: { current_page: 1, page_size: 50 } })
const create = (params: AiBillingRuleMutationParams) => request.post<{ id: number }, AiBillingRuleCreateBody>(`${ADMIN_API_PREFIX}/ai-billing-rules`, createBody(params))
const update = (params: AiBillingRuleMutationParams) => request.put<void, AiBillingRuleUpdateBody>(`${ADMIN_API_PREFIX}/ai-billing-rules/${positiveID(params.id ?? 0, 'AI billing rule id')}`, updateBody(params))
const changeStatus = (params: { id: Id; status: number }) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-billing-rules/${positiveID(params.id, 'AI billing rule id')}/status`, { status: params.status })
const deleteOne = (params: { id: Id }) => request.delete<void>(`${ADMIN_API_PREFIX}/ai-billing-rules/${positiveID(params.id, 'AI billing rule id')}`)

export const AiBillingRuleApi = {
  pageInit,
  list,
  create,
  update,
  changeStatus,
  deleteOne,

  // Temporary aliases for existing callers during RESTful naming migration.
  init: pageInit,
  add: create,
  edit: update,
  status: changeStatus,
  del: deleteOne,
}
