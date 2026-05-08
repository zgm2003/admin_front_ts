import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { PaginatedResponse } from '@/types/common'

export interface PaymentEventListParams { current_page: number; page_size: number; order_no?: string; out_trade_no?: string; event_type?: string; process_status?: number | '' }
export interface PaymentEventListItem { id: number; order_no: string; out_trade_no: string; event_type: string; event_type_text: string; provider: string; process_status: number; process_status_text: string; error_message: string; created_at: string }

export const PaymentEventApi = {
  list: (params: PaymentEventListParams) => request.get<PaginatedResponse<PaymentEventListItem>>(`${ADMIN_API_PREFIX}/payment/events`, { params }),
}
