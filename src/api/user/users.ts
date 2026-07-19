import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import {
  adminOperations,
  type AdminOperationInput,
  type AdminOperationOutput,
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
  UserLoginType,
  UserVerifyType,
  UsersListParams,
  UserEditParams,
  UserBatchEditParams,
} from '@/types/user'

type UserListQueryParams = AdminOperationInput<'get_api_admin_v1_users'>['query']
type UserSessionListQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_user_sessions'>['query']>
type LoginConfigContract = AdminOperationOutput<'get_api_admin_v1_auth_login_config'>
type CaptchaContract = AdminOperationOutput<'get_api_admin_v1_auth_captcha'>
type PersonalContract = AdminOperationOutput<'get_api_admin_v1_profile'>

function isUserLoginType(value: string): value is UserLoginType {
  return value === 'email' || value === 'phone' || value === 'password'
}

function isUserVerifyType(value: string): value is UserVerifyType {
  return value === 'password' || value === 'code'
}

function toLoginConfig(response: LoginConfigContract): LoginConfigResponse {
  if (response.captcha_type !== 'slide') {
    throw new Error('login config captcha_type violates the supported contract')
  }
  const loginTypeArr = response.login_type_arr.map((option) => {
    if (!isUserLoginType(option.value)) {
      throw new Error('login config login_type_arr violates the supported contract')
    }
    return { label: option.label, value: option.value }
  })
  return {
    login_type_arr: loginTypeArr,
    captcha_enabled: response.captcha_enabled,
    captcha_type: response.captcha_type,
  }
}

function toSlideCaptcha(response: CaptchaContract): SlideCaptchaChallenge {
  if (response.captcha_type !== 'slide') {
    throw new Error('captcha response captcha_type violates the supported contract')
  }
  return { ...response, captcha_type: response.captcha_type }
}

function toPersonalResponse(response: PersonalContract): UserPersonalInitResponse {
  if (response.profile.sex !== 0 && response.profile.sex !== 1 && response.profile.sex !== 2) {
    throw new Error('profile sex violates the editable contract')
  }
  const verifyTypeArr = response.dict.verify_type_arr.map((option) => {
    if (!isUserVerifyType(option.value)) {
      throw new Error('profile verify_type_arr violates the supported contract')
    }
    return { label: option.label, value: option.value }
  })
  return {
    profile: { ...response.profile, sex: response.profile.sex },
    dict: {
      auth_address_tree: response.dict.auth_address_tree,
      sexArr: response.dict.sexArr,
      verify_type_arr: verifyTypeArr,
    },
  }
}

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

function positiveFilterID(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} id must be a positive integer`)
  }
  return value
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
    if (params.address_id.length > 0) {
      query.address_id = params.address_id
        .map((value) => positiveFilterID(value, 'address'))
        .join(',')
    }
  } else if (typeof params.address_id === 'number') {
    query.address_id = String(positiveFilterID(params.address_id, 'address'))
  }
  if (Array.isArray(params.date) && params.date.length >= 2 && params.date[0] && params.date[1]) {
    query.date = `${params.date[0]},${params.date[1]}`
  }

  return query
}

function normalizeUserSessionListParams(params: UserSessionListParams): UserSessionListQuery {
  const query: UserSessionListQuery = {
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
  async getLoginConfig(options: ExecuteOptions = {}): Promise<LoginConfigResponse> {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_auth_login_config, {}, options)
    return toLoginConfig(response)
  },

  async getCaptcha(options: ExecuteOptions = {}): Promise<SlideCaptchaChallenge> {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_auth_captcha, {}, options)
    return toSlideCaptcha(response)
  },

  async sendCode(params: UserSendCodeParams, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.post_api_admin_v1_auth_send_code, {
      body: params,
    }, options)
  },

  async forgetPassword(params: UserForgetPasswordParams, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.post_api_admin_v1_auth_forgot_password, {
      body: params,
    }, options)
  },

  initPersonal: async (params?: { user_id?: number }, options: ExecuteOptions = {}): Promise<UserPersonalInitResponse> => {
    const userID = params?.user_id
    if (userID === undefined) {
      const response = await executeAdminOperation(adminOperations.get_api_admin_v1_profile, {}, options)
      return toPersonalResponse(response)
    }
    if (typeof userID !== 'number' || !Number.isInteger(userID) || userID <= 0) {
      throw new Error('profile user id must be a positive integer')
    }
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_users_id_profile, {
      path: { id: userID },
    }, options)
    return toPersonalResponse(response)
  },

  async editPersonal(params: UserPersonalEditParams, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.put_api_admin_v1_profile, { body: params }, options)
  },

  async updatePhone(params: UserPhoneUpdateParams, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.put_api_admin_v1_profile_security_phone, { body: params }, options)
  },

  async updateEmail(params: UserEmailUpdateParams, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.put_api_admin_v1_profile_security_email, { body: params }, options)
  },

  async updatePassword(params: UserPasswordUpdateParams, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.put_api_admin_v1_profile_security_password, { body: params }, options)
  },
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
  pageInit: (options: ExecuteOptions = {}): Promise<UserSessionPageInitResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_user_sessions_page_init, {}, options),

  list: (params: UserSessionListParams, options: ExecuteOptions = {}): Promise<UserSessionListResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_user_sessions, {
      query: normalizeUserSessionListParams(params),
    }, options),

  stats: (options: ExecuteOptions = {}): Promise<UserSessionStats> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_user_sessions_stats, {}, options),

  kick: (params: UserSessionKickParams, options: ExecuteOptions = {}): Promise<UserSessionKickResponse> =>
    executeAdminOperation(adminOperations.patch_api_admin_v1_user_sessions_id_revoke, {
      path: { id: params.id },
    }, options),

  batchKick: (params: UserSessionBatchKickParams, options: ExecuteOptions = {}): Promise<UserSessionBatchKickResponse> => {
    const ids = normalizePositiveIDs(params.ids, 'user session')
    return executeAdminOperation(adminOperations.patch_api_admin_v1_user_sessions_revoke, {
      body: { ids },
    }, options)
  },
}

export type { UserSessionItem }
