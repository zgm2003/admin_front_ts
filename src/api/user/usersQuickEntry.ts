import request from '@/lib/http'
import type { QuickEntryItem } from '@/types/user'

export const UsersQuickEntryApi = {
  save: (params: { permission_ids: number[] }) =>
    request.post<{ quick_entry: QuickEntryItem[] }>('/api/admin/UsersQuickEntry/save', params),
}
