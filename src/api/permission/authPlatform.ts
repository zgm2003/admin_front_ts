import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse } from '@/types/common'

export type AuthPlatformLoginType = 'email' | 'phone' | 'password'
export type AuthPlatformCaptchaType = 'slide'

export interface AuthPlatformInitResponse {
  dict: {
    common_status_arr: DictOption<number>[]
    auth_platform_login_type_arr: DictOption<AuthPlatformLoginType>[]
    auth_platform_captcha_type_arr: DictOption<AuthPlatformCaptchaType>[]
  }
}

export interface AuthPlatformListParams {
  current_page: number
  page_size: number
  name?: string
  status?: number | ''
}

interface AuthPlatformListQueryParams {
  current_page: number
  page_size: number
  name?: string
  status?: number
}

export interface AuthPlatformItem {
  id: number
  code: string
  name: string
  login_types: AuthPlatformLoginType[]
  captcha_type: AuthPlatformCaptchaType
  access_ttl: number
  refresh_ttl: number
  bind_platform: number
  bind_device: number
  bind_ip: number
  single_session: number
  max_sessions: number
  allow_register: number
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AuthPlatformAddPayload {
  code: string
  name: string
  login_types: AuthPlatformLoginType[]
  captcha_type: AuthPlatformCaptchaType
  access_ttl: number
  refresh_ttl: number
  bind_platform: number
  bind_device: number
  bind_ip: number
  single_session: number
  max_sessions: number
  allow_register: number
}

export interface AuthPlatformCreateResponse {
  id: number
}

export type AuthPlatformUpdatePayload = Omit<AuthPlatformAddPayload, 'code'>

export interface AuthPlatformEditPayload extends AuthPlatformUpdatePayload {
  id: number
}

export interface AuthPlatformBatchDeletePayload {
  ids: number[]
}

export interface AuthPlatformStatusPayload {
  id: number
  status: number
}

export interface AuthPlatformStatusBody {
  status: number
}

function normalizeListParams(params: AuthPlatformListParams): AuthPlatformListQueryParams {
  const query: AuthPlatformListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (params.name) {
    query.name = params.name
  }
  if (typeof params.status === 'number') {
    query.status = params.status
  }

  return query
}

function normalizeAuthPlatformIDs(id: Id | Id[]): number[] {
  const values = Array.isArray(id) ? id : [id]
  const ids: number[] = []
  const seen = new Set<number>()

  for (const value of values) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new Error('auth platform id must be a positive integer')
    }
    if (seen.has(value)) {
      continue
    }
    seen.add(value)
    ids.push(value)
  }

  return ids
}

const pageInit = () => request.get<AuthPlatformInitResponse>(`${ADMIN_API_PREFIX}/auth-platforms/page-init`)
const create = (params: AuthPlatformAddPayload) => request.post<AuthPlatformCreateResponse, AuthPlatformAddPayload>(`${ADMIN_API_PREFIX}/auth-platforms`, params)
const update = (params: AuthPlatformEditPayload) => {
  const { id, ...body } = params
  return request.put<void, AuthPlatformUpdatePayload>(`${ADMIN_API_PREFIX}/auth-platforms/${id}`, body)
}
const deleteOne = (params: { id: Id }) => request.delete<void>(`${ADMIN_API_PREFIX}/auth-platforms/${normalizeAuthPlatformIDs(params.id)[0]}`)
const deleteBatch = (params: AuthPlatformBatchDeletePayload) => {
  const ids = normalizeAuthPlatformIDs(params.ids)
  const body: AuthPlatformBatchDeletePayload = { ids }
  return request.delete<void, AuthPlatformBatchDeletePayload>(`${ADMIN_API_PREFIX}/auth-platforms`, { data: body })
}
const changeStatus = (params: AuthPlatformStatusPayload) => {
  const body: AuthPlatformStatusBody = { status: params.status }
  return request.patch<void, AuthPlatformStatusBody>(`${ADMIN_API_PREFIX}/auth-platforms/${params.id}/status`, body)
}

export const AuthPlatformApi = {
  pageInit,
  list: (params: AuthPlatformListParams) => request.get<PaginatedResponse<AuthPlatformItem>>(`${ADMIN_API_PREFIX}/auth-platforms`, { params: normalizeListParams(params) }),
  create,
  update,
  deleteOne,
  deleteBatch,
  changeStatus,
}
