import request from '@/lib/http'
import type { UserLoginLogCursorParams, UserLoginLogInitResponse, UserLoginLogItem, UserLoginLogListParams, UserLoginLogListResponse } from '@/types/user'
import type { CursorPaginatedResponse, RequestPayload } from '@/types/common'

export const UsersLoginLogApi = {
  init: (params?: RequestPayload) =>
    request.post<UserLoginLogInitResponse>('/api/admin/UsersLoginLog/init', params),

  list: (params: UserLoginLogListParams) =>
    request.post<UserLoginLogListResponse>('/api/admin/UsersLoginLog/list', params),

  listCursor: (params: UserLoginLogCursorParams) =>
    request.post<CursorPaginatedResponse<UserLoginLogItem>>('/api/admin/UsersLoginLog/listCursor', params),
}
