import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { UserLoginLogInitResponse, UserLoginLogListParams, UserLoginLogListResponse } from '@/types/user'

type UserLoginLogQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_users_login_logs'>['query']>

function normalizeLoginLogListParams(params: UserLoginLogListParams): UserLoginLogQueryParams {
  const query: UserLoginLogQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (params.user_id !== undefined && params.user_id !== '') {
    if (typeof params.user_id !== 'number' || !Number.isInteger(params.user_id) || params.user_id <= 0) {
      throw new Error('login log user id must be a positive integer')
    }
    query.user_id = params.user_id
  }
  const loginAccount = params.login_account?.trim()
  if (loginAccount) {
    query.login_account = loginAccount
  }
  if (params.login_type) {
    query.login_type = params.login_type
  }
  const ip = params.ip?.trim()
  if (ip) {
    query.ip = ip
  }
  if (params.platform) {
    query.platform = params.platform
  }
  if (params.is_success !== undefined && params.is_success !== '') {
    if (params.is_success !== 0 && params.is_success !== 1) {
      throw new Error('login log success filter must be 0 or 1')
    }
    query.is_success = params.is_success
  }
  if (Array.isArray(params.date) && params.date.length >= 2 && params.date[0] && params.date[1]) {
    query.date_start = params.date[0]
    query.date_end = params.date[1]
  }
  return query
}

export const UsersLoginLogApi = {
  pageInit: (options: ExecuteOptions = {}): Promise<UserLoginLogInitResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_users_login_logs_page_init, {}, options),

  list: (params: UserLoginLogListParams, options: ExecuteOptions = {}): Promise<UserLoginLogListResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_users_login_logs, {
      query: normalizeLoginLogListParams(params),
    }, options),
}
