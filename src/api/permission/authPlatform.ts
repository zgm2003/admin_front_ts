import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { Id } from '@/types/common'

type AuthPlatformCreateBody = NonNullable<AdminOperationInput<'post_api_admin_v1_auth_platforms'>['body']>
type AuthPlatformUpdateBody = NonNullable<AdminOperationInput<'put_api_admin_v1_auth_platforms_id'>['body']>
type AuthPlatformStatusBody = NonNullable<AdminOperationInput<'patch_api_admin_v1_auth_platforms_id_status'>['body']>

export type AuthPlatformLoginType = AuthPlatformCreateBody['login_types'][number]
export type AuthPlatformCaptchaType = AuthPlatformCreateBody['captcha_type']

export type AuthPlatformInitResponse = components['schemas']['Go_internal_module_auth_platform_InitResponse_Output']

export interface AuthPlatformListParams {
  current_page: number
  page_size: number
  name?: string
  status?: 1 | 2 | ''
}

type AuthPlatformListQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_auth_platforms'>['query']>

type AuthPlatformContractItem = components['schemas']['Go_internal_module_auth_platform_ListItem_Output']
type AuthPlatformEditableFields = Pick<
  AuthPlatformCreateBody,
  'login_types' | 'captcha_type' | 'bind_platform' | 'bind_device' | 'bind_ip' | 'allow_register'
>
export type AuthPlatformItem = Omit<AuthPlatformContractItem, keyof AuthPlatformEditableFields | 'status'>
  & AuthPlatformEditableFields
  & { status: 1 | 2 }
export interface AuthPlatformListResponse extends Omit<components['schemas']['Go_internal_module_auth_platform_ListResponse_Output'], 'list'> {
  list: AuthPlatformItem[]
}

export type AuthPlatformAddPayload = AuthPlatformCreateBody

export type AuthPlatformCreateResponse = components['schemas']['Go_internal_server_adminroute_IDData_Output']

export type AuthPlatformUpdatePayload = AuthPlatformUpdateBody

export interface AuthPlatformEditPayload extends AuthPlatformUpdatePayload {
  id: number
}

export interface AuthPlatformBatchDeletePayload {
  ids: number[]
}

export interface AuthPlatformStatusPayload {
  id: number
  status: AuthPlatformStatusBody['status']
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

function normalizeAuthPlatformIDs(id: Id | Id[]): [number, ...number[]] {
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

  const first = ids[0]
  if (first === undefined) throw new Error('auth platform ids must not be empty')
  return [first, ...ids.slice(1)]
}

function isLoginType(value: string): value is AuthPlatformLoginType {
  return value === 'email' || value === 'phone' || value === 'password'
}

function isBinaryStatus(value: number): value is 1 | 2 {
  return value === 1 || value === 2
}

function toAuthPlatformItem(item: AuthPlatformContractItem): AuthPlatformItem {
  if (
    !item.login_types.every(isLoginType)
    || item.captcha_type !== 'slide'
    || !isBinaryStatus(item.bind_platform)
    || !isBinaryStatus(item.bind_device)
    || !isBinaryStatus(item.bind_ip)
    || !isBinaryStatus(item.allow_register)
    || !isBinaryStatus(item.status)
  ) {
    throw new Error('auth platform list item violates the editable contract')
  }
  return {
    ...item,
    login_types: item.login_types,
    captcha_type: item.captcha_type,
    bind_platform: item.bind_platform,
    bind_device: item.bind_device,
    bind_ip: item.bind_ip,
    allow_register: item.allow_register,
    status: item.status,
  }
}

const pageInit = (options: ExecuteOptions = {}): Promise<AuthPlatformInitResponse> =>
  executeAdminOperation(adminOperations.get_api_admin_v1_auth_platforms_page_init, {}, options)
const create = (params: AuthPlatformAddPayload, options: ExecuteOptions = {}): Promise<AuthPlatformCreateResponse> =>
  executeAdminOperation(adminOperations.post_api_admin_v1_auth_platforms, { body: params }, options)
const update = async (params: AuthPlatformEditPayload, options: ExecuteOptions = {}): Promise<void> => {
  const { id, ...body } = params
  await executeAdminOperation(adminOperations.put_api_admin_v1_auth_platforms_id, {
    path: { id },
    body,
  }, options)
}
const deleteOne = async (params: { id: Id }, options: ExecuteOptions = {}): Promise<void> => {
  const [id] = normalizeAuthPlatformIDs(params.id)
  await executeAdminOperation(adminOperations.delete_api_admin_v1_auth_platforms_id, { path: { id } }, options)
}
const deleteBatch = async (params: AuthPlatformBatchDeletePayload, options: ExecuteOptions = {}): Promise<void> => {
  const ids = normalizeAuthPlatformIDs(params.ids)
  await executeAdminOperation(adminOperations.delete_api_admin_v1_auth_platforms, { body: { ids } }, options)
}
const changeStatus = async (params: AuthPlatformStatusPayload, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.patch_api_admin_v1_auth_platforms_id_status, {
    path: { id: params.id },
    body: { status: params.status },
  }, options)
}

export const AuthPlatformApi = {
  pageInit,
  list: async (params: AuthPlatformListParams, options: ExecuteOptions = {}): Promise<AuthPlatformListResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_auth_platforms, {
      query: normalizeListParams(params),
    }, options)
    return { list: response.list.map(toAuthPlatformItem), page: response.page }
  },
  create,
  update,
  deleteOne,
  deleteBatch,
  changeStatus,
}
