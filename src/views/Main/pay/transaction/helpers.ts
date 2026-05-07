import { TxnStatus } from '@/enums'
import type { PayTransactionListParams } from '@/api/pay/transaction'
import type { RequestPayload } from '@/types/common'
import type { UserListItem } from '@/types/user'

export type PayTransactionTableParams = Omit<PayTransactionListParams, 'start_date' | 'end_date'> & RequestPayload & {
  date?: string[]
}

interface TransactionUserDisplayRow {
  user_id?: number
  user_name?: string
  user_email?: string
}

function trimOptional(value: string | undefined): string | undefined {
  const next = value?.trim()
  return next ? next : undefined
}

export function toPayTransactionListQuery(params: PayTransactionTableParams): PayTransactionListParams {
  const [startDate, endDate] = params.date ?? []
  const query: PayTransactionListParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  const orderNo = trimOptional(params.order_no)
  if (orderNo) {
    query.order_no = orderNo
  }
  const transactionNo = trimOptional(params.transaction_no)
  if (transactionNo) {
    query.transaction_no = transactionNo
  }
  if (typeof params.user_id === 'number') {
    query.user_id = params.user_id
  }
  if (typeof params.channel === 'number') {
    query.channel = params.channel
  }
  if (typeof params.status === 'number') {
    query.status = params.status
  }
  const trimmedStartDate = trimOptional(startDate)
  if (trimmedStartDate) {
    query.start_date = trimmedStartDate
  }
  const trimmedEndDate = trimOptional(endDate)
  if (trimmedEndDate) {
    query.end_date = trimmedEndDate
  }

  return query
}

export function formatPayTransactionUserLabel(item: Pick<UserListItem, 'username' | 'email'>) {
  return `${item.username} (${item.email})`
}

export function formatPayTransactionUserDisplay(row: TransactionUserDisplayRow) {
  if (row.user_name) {
    return row.user_email ? `${row.user_name} (${row.user_email})` : row.user_name
  }

  return row.user_id ? `#${row.user_id}` : '--'
}

export function getTransactionStatusTagType(value: number) {
  if (value === TxnStatus.SUCCESS) return 'success'
  if (value === TxnStatus.FAILED) return 'danger'
  if (value === TxnStatus.WAITING) return 'warning'
  if (value === TxnStatus.CLOSED) return 'info'
  return undefined
}
