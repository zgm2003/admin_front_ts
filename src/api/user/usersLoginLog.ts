import { legacyRequest } from '@/lib/http'
import type { UserLoginLogInitResponse, UserLoginLogListParams, UserLoginLogListResponse } from '@/types/user'
import type { RequestPayload } from '@/types/common'

export const UsersLoginLogApi = {
  init: (params?: RequestPayload) =>
    legacyRequest.post<UserLoginLogInitResponse>('/api/admin/UsersLoginLog/init', params),

  list: (params: UserLoginLogListParams) =>
    legacyRequest.post<UserLoginLogListResponse>('/api/admin/UsersLoginLog/list', params),
}
