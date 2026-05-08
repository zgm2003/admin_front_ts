import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { UserLoginLogInitResponse, UserLoginLogListParams, UserLoginLogListResponse } from '@/types/user'

type UserLoginLogQueryParams = Omit<UserLoginLogListParams, 'date'> & {
  date_start?: string
  date_end?: string
}

function normalizeLoginLogListParams(params: UserLoginLogListParams): UserLoginLogQueryParams {
  const query: UserLoginLogQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (params.user_id !== undefined && params.user_id !== '') {
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
    query.is_success = params.is_success
  }
  if (Array.isArray(params.date) && params.date.length >= 2 && params.date[0] && params.date[1]) {
    query.date_start = params.date[0]
    query.date_end = params.date[1]
  }
  return query
}

export const UsersLoginLogApi = {
  init: () =>
    request.get<UserLoginLogInitResponse>(`${ADMIN_API_PREFIX}/users/login-logs/page-init`),

  list: (params: UserLoginLogListParams) =>
    request.get<UserLoginLogListResponse>(`${ADMIN_API_PREFIX}/users/login-logs`, { params: normalizeLoginLogListParams(params) }),
}
