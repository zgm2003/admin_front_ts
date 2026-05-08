import request, { legacyRequest } from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { Id } from '@/types/common'
import type { SlideCaptchaChallenge } from '@/types/captcha'
import type {
  LoginConfigResponse,
  UserEmailUpdateParams,
  UserExportResponse,
  UserForgetPasswordParams,
  UserInitResponse,
  UserListInitResponse,
  UserListResponse,
  UserLoginParams,
  UserLoginSession,
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

type UserListQueryParams = Omit<UsersListParams, 'address_id' | 'date'> & {
  address_id?: string
  date?: string
}

type UserEditBody = Omit<UserEditParams, 'id'>
type UserBatchDeletePayload = { ids: number[] }
type UserSessionBatchKickPayload = { ids: number[] }

function normalizePositiveIDs(id: Id | Id[], label: string): number[] {
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

  return ids
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

const fetchCurrentUser = () =>
  request.get<UserInitResponse>(`${ADMIN_API_PREFIX}/users/me`)

export const UsersApi = {
  me: fetchCurrentUser,
  init: fetchCurrentUser,

  getLoginConfig: () =>
    request.get<LoginConfigResponse>(`${ADMIN_API_PREFIX}/auth/login-config`),

  getCaptcha: () =>
    request.get<SlideCaptchaChallenge>(`${ADMIN_API_PREFIX}/auth/captcha`),

  login: (params: UserLoginParams) =>
    request.post<UserLoginSession, UserLoginParams>(`${ADMIN_API_PREFIX}/auth/login`, params),

  refresh: (params: { refresh_token: string }) =>
    request.post<UserLoginSession>(`${ADMIN_API_PREFIX}/auth/refresh`, params),

  logout: (params?: { refresh_token?: string }) =>
    request.post<void, { refresh_token?: string }>(`${ADMIN_API_PREFIX}/auth/logout`, params),

  sendCode: (params: UserSendCodeParams) =>
    request.post<void, UserSendCodeParams>(`${ADMIN_API_PREFIX}/auth/send-code`, params),

  forgetPassword: (params: UserForgetPasswordParams) =>
    legacyRequest.post<void>('/api/Users/forgetPassword', params),

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
  init: () =>
    request.get<UserListInitResponse>(`${ADMIN_API_PREFIX}/users/page-init`),

  list: (params: UsersListParams) =>
    request.get<UserListResponse>(`${ADMIN_API_PREFIX}/users`, { params: normalizeUsersListParams(params) }),

  edit: (params: UserEditParams) => {
    const { id, ...body } = params
    return request.put<void, UserEditBody>(`${ADMIN_API_PREFIX}/users/${id}`, body)
  },

  batchEdit: (params: UserBatchEditParams) =>
    request.patch<void, UserBatchEditParams>(`${ADMIN_API_PREFIX}/users`, params),

  del: (params: { id: Id | Id[] }) => {
    const ids = normalizePositiveIDs(params.id, 'user')
    if (ids.length === 1) {
      return request.delete<void>(`${ADMIN_API_PREFIX}/users/${ids[0]}`)
    }
    const body: UserBatchDeletePayload = { ids }
    return request.delete<void, UserBatchDeletePayload>(`${ADMIN_API_PREFIX}/users`, { data: body })
  },

  export: (params: { ids: number[] }) =>
    request.post<UserExportResponse, { ids: number[] }>(`${ADMIN_API_PREFIX}/users/export`, params),
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
