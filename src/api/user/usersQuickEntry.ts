import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { QuickEntryItem } from '@/types/user'

export const UsersQuickEntryApi = {
  save: (params: { permission_ids: number[] }) =>
    request.put<{ quick_entry: QuickEntryItem[] }, { permission_ids: number[] }>(`${ADMIN_API_PREFIX}/users/me/quick-entries`, params),
}
