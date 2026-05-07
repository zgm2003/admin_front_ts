import type { PayNotifyLogListParams } from '@/api/pay/notify'
import type { RequestPayload } from '@/types/common'

export type PayNotifyLogTableParams = Omit<PayNotifyLogListParams, 'start_date' | 'end_date'> & RequestPayload & {
  date?: string[]
}

function trimOptional(value: string | undefined): string | undefined {
  const next = value?.trim()
  return next ? next : undefined
}

export function toPayNotifyLogListQuery(params: PayNotifyLogTableParams): PayNotifyLogListParams {
  const [startDate, endDate] = params.date ?? []
  const query: PayNotifyLogListParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  const transactionNo = trimOptional(params.transaction_no)
  if (transactionNo) {
    query.transaction_no = transactionNo
  }
  if (typeof params.channel === 'number') {
    query.channel = params.channel
  }
  if (typeof params.notify_type === 'number') {
    query.notify_type = params.notify_type
  }
  if (typeof params.process_status === 'number') {
    query.process_status = params.process_status
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

export function formatObjectJSON(value: Record<string, unknown> | undefined) {
  if (!value || Object.keys(value).length === 0) {
    return ''
  }

  return JSON.stringify(value, null, 2)
}
