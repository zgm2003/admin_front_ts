import request, { legacyRequest } from '@/lib/http'
import type { RequestPayload } from '@/types/common'
import type {
  LoginConfigResponse,
  UserCaptchaChallenge,
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
  UserSessionItem,
  UserSessionKickParams,
  UserSessionListParams,
  UserSessionListResponse,
  UserSessionStats,
  UsersListParams,
  UserEditParams,
  UserBatchEditParams,
} from '@/types/user'

export interface UserLegacyPasswordEditParams {
  password: string
  newpassword: string
  respassword: string
}

const fetchCurrentUser = () =>
  request.get<UserInitResponse>('/api/admin/v1/users/me')

export const UsersApi = {
  me: fetchCurrentUser,
  init: fetchCurrentUser,

  getLoginConfig: () =>
    request.get<LoginConfigResponse>('/api/admin/v1/auth/login-config'),

  getCaptcha: () =>
    request.get<UserCaptchaChallenge>('/api/admin/v1/auth/captcha'),

  login: (params: UserLoginParams) =>
    request.post<UserLoginSession, UserLoginParams>('/api/admin/v1/auth/login', params),

  refresh: (params: { refresh_token: string }) =>
    request.post<UserLoginSession>('/api/admin/v1/auth/refresh', params),

  logout: (params?: { refresh_token?: string }) =>
    request.post<void, { refresh_token?: string }>('/api/admin/v1/auth/logout', params),

  sendCode: (params: UserSendCodeParams) =>
    legacyRequest.post<void>('/api/Users/sendCode', params),

  forgetPassword: (params: UserForgetPasswordParams) =>
    legacyRequest.post<void>('/api/Users/forgetPassword', params),

  initPersonal: (params: { user_id: number | string }) =>
    legacyRequest.post<UserPersonalInitResponse>('/api/Users/initPersonal', params),

  editPersonal: (params: UserPersonalEditParams) =>
    legacyRequest.post<void>('/api/Users/editPersonal', params),

  EditPassword: (params: UserLegacyPasswordEditParams) =>
    legacyRequest.post<void>('/api/Users/EditPassword', params),

  updatePhone: (params: UserPhoneUpdateParams) =>
    legacyRequest.post<void>('/api/Users/updatePhone', params),

  updateEmail: (params: UserEmailUpdateParams) =>
    legacyRequest.post<void>('/api/Users/updateEmail', params),

  updatePassword: (params: UserPasswordUpdateParams) =>
    legacyRequest.post<void>('/api/Users/updatePassword', params),
}

export const UsersListApi = {
  init: (params?: RequestPayload) =>
    legacyRequest.post<UserListInitResponse>('/api/admin/UsersList/init', params),

  list: (params: UsersListParams) =>
    legacyRequest.post<UserListResponse>('/api/admin/UsersList/list', params),

  edit: (params: UserEditParams) =>
    legacyRequest.post<void>('/api/admin/UsersList/edit', params),

  batchEdit: (params: UserBatchEditParams) =>
    legacyRequest.post<void>('/api/admin/UsersList/batchEdit', params),

  del: (params: { id: number | number[] }) =>
    legacyRequest.post<void>('/api/admin/UsersList/del', params),

  export: (params: { ids: number[] }) =>
    legacyRequest.post<UserExportResponse>('/api/admin/UsersList/export', params),
}

export const UserSessionApi = {
  list: (params: UserSessionListParams) =>
    legacyRequest.post<UserSessionListResponse>('/api/admin/UserSession/list', params),

  stats: () =>
    legacyRequest.post<UserSessionStats>('/api/admin/UserSession/stats'),

  kick: (params: UserSessionKickParams) =>
    legacyRequest.post<void>('/api/admin/UserSession/kick', params),

  batchKick: (params: UserSessionBatchKickParams) =>
    legacyRequest.post<{ count: number }>('/api/admin/UserSession/batchKick', params),
}

export type { UserSessionItem }

