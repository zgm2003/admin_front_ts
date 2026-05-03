import { legacyRequest } from '@/lib/http'
import type { QuickEntryItem } from '@/types/user'

export const UsersQuickEntryApi = {
  save: (params: { permission_ids: number[] }) =>
    legacyRequest.post<{ quick_entry: QuickEntryItem[] }>('/api/admin/UsersQuickEntry/save', params),
}
