import { WalletType } from '@/enums'
import type { UserListItem } from '@/types/user'

export const formatWalletUserLabel = (item: UserListItem) => `${item.username} (${item.email})`

export const formatWalletUserDisplay = (row: { user_id?: number; user_name?: string; user_email?: string }) => {
  if (row.user_name) {
    return row.user_email ? `${row.user_name} (${row.user_email})` : row.user_name
  }

  return row.user_id ? `#${row.user_id}` : '--'
}

interface BizActionLabels {
  recharge: string
  consume: string
  adjust: string
}

export const formatWalletBizActionDisplay = (
  row: { biz_action_no?: string; order_no?: string; type?: number },
  labels: BizActionLabels,
) => {
  const bizActionNo = row.biz_action_no?.trim() ?? ''
  if (!bizActionNo) {
    return '--'
  }

  const parts = bizActionNo.split(':').filter(Boolean)
  if (parts[0] !== 'WALLET' || parts.length < 3) {
    return bizActionNo
  }

  const suffix = row.order_no?.trim() || parts.slice(2).join(':') || bizActionNo
  const typeLabelMap: Record<number, string> = {
    [WalletType.RECHARGE]: labels.recharge,
    [WalletType.CONSUME]: labels.consume,
    [WalletType.ADJUST]: labels.adjust,
  }

  const typeLabel = typeLabelMap[row.type ?? 0] ?? parts[1]
  return `${typeLabel} · ${suffix}`
}
