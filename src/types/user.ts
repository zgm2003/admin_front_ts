import type { DictOption, Id } from './common'
import type { SlideCaptchaAnswer, SlideCaptchaChallenge } from './captcha'
import type { components } from '@/modules/http/generated/admin'

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
  icon: string
  i18n_key: string
  show_menu: number
  sort: number
  parent_id: number
  children: PermissionMenuItem[]
}

export type UserCaptchaAnswer = SlideCaptchaAnswer
export type UserCaptchaChallenge = SlideCaptchaChallenge

export interface LoginConfigResponse {
  login_type_arr: DictOption<UserLoginType>[]
  captcha_enabled: boolean
  captcha_type: 'slide'
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

export type UserSendCodeContext =
  | {
      account: string
      scene: 'login'
      login_type: 'email' | 'phone'
    }
  | {
      account: string
      scene: Exclude<UserScene, 'login'>
    }

export type UserSendCodeCaptchaProof = {
  captcha_id: string
  captcha_answer: UserCaptchaAnswer
}

export type UserSendCodeParams = UserSendCodeContext & UserSendCodeCaptchaProof

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
      account: string
      code: string
      new_password: string
      confirm_password: string
      old_password?: never
    }

export interface UserPersonalInfo {
  user_id: number
  username: string
  email: string
  avatar: string
  phone: string
  role_id: number
  role_name: string
  address_id: number
  detail_address: string
  sex: 0 | 1 | 2
  birthday: string
  bio: string
  is_self: number
  has_password: boolean
}

export interface UserPersonalDict {
  auth_address_tree: AddressTreeNode[]
  sexArr: DictOption<number>[]
  verify_type_arr: DictOption<UserVerifyType>[]
}

export interface UserPersonalInitResponse {
  profile: UserPersonalInfo
  dict: UserPersonalDict
}

export interface UserPersonalEditParams {
  username: string
  avatar?: string
  sex: 0 | 1 | 2
  birthday?: string | null
  address_id: number
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

export type UserListItem = components['schemas']['UserListItem']

export type UserItem = UserListItem

export interface UsersListParams {
  page_size: number
  current_page: number
  keyword?: string
  username?: string
  email?: string
  detail_address?: string
  address_id?: number | number[]
  role_id?: number | ''
  sex?: 0 | 1 | 2 | ''
  date?: string[]
}

export type AddressTreeNode = components['schemas']['AddressTreeNode']

export type UserListInitResponse = components['schemas']['UserPageInit']

export interface UserEditParams {
  id: number
  username: string
  role_id: number
  avatar?: string
  sex: 0 | 1 | 2
  address_id: number
  detail_address?: string
  bio?: string
}

export type UserBatchEditParams =
  | {
      ids: number[]
      field: 'sex'
      sex: 0 | 1 | 2
    }
  | {
      ids: number[]
      field: 'address_id'
      address_id: number
    }
  | {
      ids: number[]
      field: 'detail_address'
      detail_address: string
    }

export type UserExportResponse = components['schemas']['UserExportResult']

export interface UserSessionListParams {
  page_size: number
  current_page: number
  username?: string
  platform?: string
  status?: UserSessionStatus
}

export type UserSessionPageInitResponse = components['schemas']['Go_internal_module_auth_SessionPageInitResponse_Output']

export type UserSessionItem = components['schemas']['Go_internal_module_auth_SessionListItem_Output']

export type UserSessionStats = components['schemas']['Go_internal_module_auth_SessionStatsResponse_Output']

export interface UserSessionKickParams {
  id: number
}

export type UserSessionKickResponse = components['schemas']['Go_internal_module_auth_SessionRevokeResponse_Output']

export interface UserSessionBatchKickParams {
  ids: number[]
}

export type UserSessionBatchKickResponse = components['schemas']['Go_internal_module_auth_SessionBatchRevokeResponse_Output']

export type UserLoginLogItem = components['schemas']['Go_internal_module_auth_LoginLogListItem_Output']

export interface UserLoginLogListParams {
  page_size: number
  current_page: number
  user_id?: number | ''
  login_account?: string
  login_type?: string
  ip?: string
  platform?: string
  is_success?: number | ''
  date?: string[]
}

export type UserLoginLogInitResponse = components['schemas']['Go_internal_module_auth_LoginLogPageInitResponse_Output']

export type UserListResponse = components['schemas']['UserListResult']
export type UserSessionListResponse = components['schemas']['Go_internal_module_auth_SessionListResponse_Output']
export type UserLoginLogListResponse = components['schemas']['Go_internal_module_auth_LoginLogListResponse_Output']

export type UserIdentity = Id
