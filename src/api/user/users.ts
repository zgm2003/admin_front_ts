import request, { executeAdminOperation } from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { ExecuteOptions } from '@/modules/http/client'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { Id } from '@/types/common'
import type { SlideCaptchaChallenge } from '@/types/captcha'
import type {
  LoginConfigResponse,
  UserEmailUpdateParams,
  UserExportResponse,
  UserForgetPasswordParams,
  UserListInitResponse,
  UserListResponse,
  UserPasswordUpdateParams,
  UserPersonalEditParams,
  UserPersonalInitResponse,
  UserPhoneUpdateParams,
  UserSendCodeParams,
  UserSessionBatchKickParams,
  UserSessionBatchKickResponse,
  UserSessionItem,
  UserSessionKickParams,
  UserSessionKickResponse,
  UserSessionListParams,
  UserSessionListResponse,
  UserSessionPageInitResponse,
  UserSessionStats,
  UsersListParams,
  UserEditParams,
  UserBatchEditParams,
} from '@/types/user'

type UserListQueryParams = AdminOperationInput<'get_api_admin_v1_users'>['query']
type UserSessionBatchKickPayload = { ids: number[] }

function normalizePositiveIDs(id: Id | Id[], label: string): [number, ...number[]] {
  const values = Array.isArray(id) ? id : [id]
  const ids: number[] = []
  const seen = new Set<number>()

  for (const value of values) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new Error(`${label} id must be a positive integer`)
    }
    if (seen.has(value)) {
      continue
    }
    seen.add(value)
    ids.push(value)
  }

  const first = ids[0]
  if (first === undefined) throw new Error(`${label} ids must not be empty`)

  return [first, ...ids.slice(1)]
}

function setStringIfPresent(target: UserListQueryParams, key: 'keyword' | 'username' | 'email' | 'detail_address', value: string | undefined) {
  const nextValue = value?.trim()
  if (nextValue) {
    target[key] = nextValue
  }
}

function normalizeUsersListParams(params: UsersListParams): UserListQueryParams {
  const query: UserListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  setStringIfPresent(query, 'keyword', params.keyword)
  setStringIfPresent(query, 'username', params.username)
  setStringIfPresent(query, 'email', params.email)
  setStringIfPresent(query, 'detail_address', params.detail_address)

  if (typeof params.role_id === 'number') {
    query.role_id = params.role_id
  }
  if (typeof params.sex === 'number') {
    query.sex = params.sex
  }
  if (Array.isArray(params.address_id)) {
    const values = params.address_id.filter((value) => Number.isInteger(value) && value > 0)
    if (values.length > 0) {
      query.address_id = values.join(',')
    }
  } else if (typeof params.address_id === 'number' && params.address_id > 0) {
    query.address_id = String(params.address_id)
  }
  if (Array.isArray(params.date) && params.date.length >= 2 && params.date[0] && params.date[1]) {
    query.date = `${params.date[0]},${params.date[1]}`
  }

  return query
}

function normalizeUserSessionListParams(params: UserSessionListParams): UserSessionListParams {
  const query: UserSessionListParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  const username = params.username?.trim()
  if (username) {
    query.username = username
  }
  if (params.platform) {
    query.platform = params.platform
  }
  if (params.status) {
    query.status = params.status
  }
  return query
}

export const UsersApi = {
  getLoginConfig: () =>
    request.get<LoginConfigResponse>(`${ADMIN_API_PREFIX}/auth/login-config`),

  getCaptcha: () =>
    request.get<SlideCaptchaChallenge>(`${ADMIN_API_PREFIX}/auth/captcha`),

  sendCode: (params: UserSendCodeParams) =>
    request.post<void, UserSendCodeParams>(`${ADMIN_API_PREFIX}/auth/send-code`, params),

  forgetPassword: (params: UserForgetPasswordParams) =>
    request.post<void, UserForgetPasswordParams>(`${ADMIN_API_PREFIX}/auth/forgot-password`, params),

  initPersonal: (params?: { user_id?: number | string }) => {
    const rawUserID = params?.user_id
    const userID = typeof rawUserID === 'string' ? Number(rawUserID) : rawUserID
    if (typeof userID === 'number' && Number.isInteger(userID) && userID > 0) {
      return request.get<UserPersonalInitResponse>(`${ADMIN_API_PREFIX}/users/${userID}/profile`)
    }
    return request.get<UserPersonalInitResponse>(`${ADMIN_API_PREFIX}/profile`)
  },

  editPersonal: (params: UserPersonalEditParams) =>
    request.put<void, UserPersonalEditParams>(`${ADMIN_API_PREFIX}/profile`, params),

  updatePhone: (params: UserPhoneUpdateParams) =>
    request.put<void, UserPhoneUpdateParams>(`${ADMIN_API_PREFIX}/profile/security/phone`, params),

  updateEmail: (params: UserEmailUpdateParams) =>
    request.put<void, UserEmailUpdateParams>(`${ADMIN_API_PREFIX}/profile/security/email`, params),

  updatePassword: (params: UserPasswordUpdateParams) =>
    request.put<void, UserPasswordUpdateParams>(`${ADMIN_API_PREFIX}/profile/security/password`, params),
}

export const UsersListApi = {
  pageInit: (options: ExecuteOptions = {}): Promise<UserListInitResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_users_page_init, {}, options),

  list: (params: UsersListParams, options: ExecuteOptions = {}): Promise<UserListResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_users, {
      query: normalizeUsersListParams(params),
    }, options),

  async update(params: UserEditParams, options: ExecuteOptions = {}): Promise<void> {
    const { id, ...body } = params
    await executeAdminOperation(adminOperations.put_api_admin_v1_users_id, {
      path: { id },
      body,
    }, options)
  },

  async batchEdit(params: UserBatchEditParams, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.patch_api_admin_v1_users, {
      body: params,
    }, options)
  },

  async changeStatus(params: { id: Id; status: 1 | 2 }, options: ExecuteOptions = {}): Promise<void> {
    const ids = normalizePositiveIDs(params.id, 'user')
    await executeAdminOperation(adminOperations.patch_api_admin_v1_users_id_status, {
      path: { id: ids[0] },
      body: { status: params.status },
    }, options)
  },

  async deleteOne(params: { id: Id }, options: ExecuteOptions = {}): Promise<void> {
    const [id] = normalizePositiveIDs(params.id, 'user')
    await executeAdminOperation(adminOperations.delete_api_admin_v1_users_id, {
      path: { id },
    }, options)
  },

  async deleteBatch(params: { ids: Id[] }, options: ExecuteOptions = {}): Promise<void> {
    const ids = normalizePositiveIDs(params.ids, 'user')
    await executeAdminOperation(adminOperations.delete_api_admin_v1_users, {
      body: { ids },
    }, options)
  },

  export: (params: { ids: number[] }, options: ExecuteOptions = {}): Promise<UserExportResponse> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_users_export, {
      body: { ids: normalizePositiveIDs(params.ids, 'user') },
    }, options),
}

export const UserSessionApi = {
  pageInit: () =>
    request.get<UserSessionPageInitResponse>(`${ADMIN_API_PREFIX}/user-sessions/page-init`),

  list: (params: UserSessionListParams) =>
    request.get<UserSessionListResponse>(`${ADMIN_API_PREFIX}/user-sessions`, { params: normalizeUserSessionListParams(params) }),

  stats: () =>
    request.get<UserSessionStats>(`${ADMIN_API_PREFIX}/user-sessions/stats`),

  kick: (params: UserSessionKickParams) =>
    request.patch<UserSessionKickResponse>(`${ADMIN_API_PREFIX}/user-sessions/${params.id}/revoke`),

  batchKick: (params: UserSessionBatchKickParams) => {
    const ids = normalizePositiveIDs(params.ids, 'user session')
    return request.patch<UserSessionBatchKickResponse, UserSessionBatchKickPayload>(`${ADMIN_API_PREFIX}/user-sessions/revoke`, { ids })
  },
}

export type { UserSessionItem }
