import type { DictOption, Id, PaginatedResponse } from './common'

export type UserScene =
  | 'login'
  | 'forget'
  | 'bind_phone'
  | 'bind_email'
  | 'change_password'

export type UserLoginType = 'email' | 'phone' | 'password'
export type UserVerifyType = 'password' | 'code'
export type UserSessionStatus = 'active' | 'expired' | 'revoked'

export interface PermissionMenuItem {
  index: string
  label: string
  path: string
  icon?: string
  i18n_key?: string
  show_menu?: number | boolean
  children?: PermissionMenuItem[]
}

export interface DynamicRouteItem {
  name: string
  path: string
  view_key: string
  meta?: {
    menuId?: string
    [key: string]: unknown
  }
}

export interface QuickEntryItem {
  id: number
  permission_id: number
  sort?: number
}

export interface UserInitResponse {
  user_id: number
  username: string
  avatar: string
  role_name: string
  permissions: PermissionMenuItem[]
  router: DynamicRouteItem[]
  buttonCodes: string[]
  quick_entry: QuickEntryItem[]
}

export interface UserLoginSession {
  access_token: string
  refresh_token: string
  expires_in: number
  refresh_expires_in: number
  is_new_user?: boolean
}

export interface LoginConfigResponse {
  login_type_arr: DictOption<UserLoginType>[]
}

export type UserLoginParams =
  | {
      login_account: string
      login_type: 'password'
      password: string
    }
  | {
      login_account: string
      login_type: 'email' | 'phone'
      code: string
    }

export interface UserSendCodeParams {
  account: string
  scene: UserScene
}

export interface UserForgetPasswordParams {
  account: string
  new_password: string
  confirm_password: string
  code: string
}

export type UserPasswordUpdateParams =
  | {
      verify_type: 'password'
      old_password: string
      new_password: string
      confirm_password: string
      code?: never
    }
  | {
      verify_type: 'code'
      code: string
      new_password: string
      confirm_password: string
      old_password?: never
    }

export interface UserPersonalInfo {
  username: string
  email: string
  avatar: string
  phone: string
  role_id: number
  role_name: string
  address: number
  detail_address: string
  sex: number
  birthday: string
  bio: string
  is_self: number
  has_password: boolean
}

export interface UserPersonalInitResponse {
  list: UserPersonalInfo
  dict: {
    auth_address_tree: unknown[]
    sexArr: DictOption<number>[]
    verify_type_arr: DictOption<UserVerifyType>[]
  }
}

export interface UserPersonalEditParams {
  username: string
  avatar?: string
  sex: number
  birthday?: string | null
  address: number
  detail_address?: string
  bio?: string
}

export interface UserPhoneUpdateParams {
  phone: string
  code: string
}

export interface UserEmailUpdateParams {
  email: string
  code: string
}

export interface UserListItem {
  id: number
  username: string
  email: string
  phone: string
  avatar: string | null
  sex: number
  sex_show: string
  role_id: number
  role_name: string
  bio: string
  address_show: string
  address: number
  detail_address: string
  created_at: string
}

export type UserItem = UserListItem

export interface UsersListParams {
  page_size: number
  current_page: number
  keyword?: string
  username?: string
  email?: string
  detail_address?: string
  address_id?: number | number[]
  address?: number | number[]
  role_id?: number | string
  sex?: number | string
  date?: string[]
}

export interface UserListInitResponse {
  dict: {
    roleArr: DictOption<number>[]
    auth_address_tree: unknown[]
    sexArr: DictOption<number>[]
    platformArr: DictOption<string>[]
  }
}

export interface UserEditParams {
  id: number
  username: string
  role_id: number
  avatar?: string
  sex: number
  address: number
  detail_address?: string
  bio?: string
}

export type UserBatchEditParams =
  | {
      ids: number[]
      field: 'sex'
      sex: number
    }
  | {
      ids: number[]
      field: 'address'
      address: number
    }
  | {
      ids: number[]
      field: 'detail_address'
      detail_address: string
    }

export interface UserExportResponse {
  message: string
}

export interface UserSessionListParams {
  page_size: number
  current_page: number
  username?: string
  platform?: string
  status?: UserSessionStatus
}

export interface UserSessionItem {
  id: number
  user_id: number
  username: string
  platform: string
  platform_name: string
  device_id: string
  ip: string
  ua: string
  last_seen_at: string
  created_at: string
  expires_at: string
  refresh_expires_at: string
  revoked_at: string | null
  status: UserSessionStatus
}

export interface UserSessionStats {
  total_active: number
  platform_distribution: Record<string, number> & {
    admin: number
    app: number
  }
}

export interface UserSessionKickParams {
  id: number
}

export interface UserSessionBatchKickParams {
  ids: number[]
}

export interface UserLoginLogItem {
  id: number
  user_name: string
  login_account: string
  login_type: UserLoginType
  login_type_name: string
  platform: string
  platform_name: string
  ip: string
  ua: string
  is_success: number
  reason: string
  created_at: string
}

export interface UserLoginLogListParams {
  page_size: number
  current_page: number
  user_id?: number | string
  login_account?: string
  login_type?: UserLoginType | ''
  ip?: string
  platform?: string
  is_success?: number | string
  date?: string[]
}

export interface UserLoginLogCursorParams extends Omit<UserLoginLogListParams, 'current_page'> {
  cursor?: number | string
}

export interface UserLoginLogInitResponse {
  dict: {
    platformArr: DictOption<string>[]
    login_type_arr: DictOption<UserLoginType>[]
  }
}

export type UserListResponse = PaginatedResponse<UserListItem>
export type UserSessionListResponse = PaginatedResponse<UserSessionItem>
export type UserLoginLogListResponse = PaginatedResponse<UserLoginLogItem>

export type UserIdentity = Id
