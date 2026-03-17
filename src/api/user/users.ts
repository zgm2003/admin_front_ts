import request from '@/utils/request'
import type { RequestPayload } from '@/types/common'
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
  UserSessionItem,
  UserSessionKickParams,
  UserSessionListParams,
  UserSessionListResponse,
  UserSessionStats,
  UsersListParams,
  UserEditParams,
  UserBatchEditParams,
} from '@/types/user'

export interface UserRegisterParams {
  username: string
  email: string
  password: string
  respassword: string
  code: string
}

export interface UserLegacyPasswordEditParams {
  password: string
  newpassword: string
  respassword: string
}

export const UsersApi = {
  register: (params: UserRegisterParams) =>
    request.post<void>('/api/Users/register', params),

  init: (params?: RequestPayload) =>
    request.post<UserInitResponse>('/api/Users/init', params),

  getLoginConfig: () =>
    request.post<LoginConfigResponse>('/api/Users/getLoginConfig', {}),

  login: (params: UserLoginParams) =>
    request.post<UserLoginSession>('/api/Users/login', params),

  refresh: (params: { refresh_token: string }) =>
    request.post<UserLoginSession>('/api/Users/refresh', params),

  logout: (params?: { refresh_token?: string }) =>
    request.post<void>('/api/Users/logout', params),

  sendCode: (params: UserSendCodeParams) =>
    request.post<void>('/api/Users/sendCode', params),

  forgetPassword: (params: UserForgetPasswordParams) =>
    request.post<void>('/api/Users/forgetPassword', params),

  initPersonal: (params: { user_id: number | string }) =>
    request.post<UserPersonalInitResponse>('/api/Users/initPersonal', params),

  editPersonal: (params: UserPersonalEditParams) =>
    request.post<void>('/api/Users/editPersonal', params),

  EditPassword: (params: UserLegacyPasswordEditParams) =>
    request.post<void>('/api/Users/EditPassword', params),

  updatePhone: (params: UserPhoneUpdateParams) =>
    request.post<void>('/api/Users/updatePhone', params),

  updateEmail: (params: UserEmailUpdateParams) =>
    request.post<void>('/api/Users/updateEmail', params),

  updatePassword: (params: UserPasswordUpdateParams) =>
    request.post<void>('/api/Users/updatePassword', params),
}

export const UsersListApi = {
  init: (params?: RequestPayload) =>
    request.post<UserListInitResponse>('/api/admin/UsersList/init', params),

  list: (params: UsersListParams) =>
    request.post<UserListResponse>('/api/admin/UsersList/list', params),

  edit: (params: UserEditParams) =>
    request.post<void>('/api/admin/UsersList/edit', params),

  batchEdit: (params: UserBatchEditParams) =>
    request.post<void>('/api/admin/UsersList/batchEdit', params),

  del: (params: { id: number | number[] }) =>
    request.post<void>('/api/admin/UsersList/del', params),

  export: (params: { ids: number[] }) =>
    request.post<UserExportResponse>('/api/admin/UsersList/export', params),
}

export const UserSessionApi = {
  list: (params: UserSessionListParams) =>
    request.post<UserSessionListResponse>('/api/admin/UserSession/list', params),

  stats: () =>
    request.post<UserSessionStats>('/api/admin/UserSession/stats'),

  kick: (params: UserSessionKickParams) =>
    request.post<void>('/api/admin/UserSession/kick', params),

  batchKick: (params: UserSessionBatchKickParams) =>
    request.post<{ count: number }>('/api/admin/UserSession/batchKick', params),
}

export type { UserSessionItem }
