import { computed, onMounted, ref } from 'vue'
import { PaymentEventApi, type PaymentEventListItem, type PaymentEventListParams } from '@/api/payment/event'
import { useTable } from '@/components/Table'
import type { SearchField } from '@/components/Search/types'

export function usePaymentEventPage() {
  const searchForm = ref<PaymentEventListParams>({
    current_page: 1,
    page_size: 20,
    order_no: '',
    out_trade_no: '',
    event_type: '',
    process_status: '',
  })
  const table = useTable<PaymentEventListItem, PaymentEventListParams>({ api: PaymentEventApi, searchForm })
  const columns = computed(() => [
    { key: 'order_no', label: '支付订单号', width: 210 },
    { key: 'out_trade_no', label: '商户单号', width: 210 },
    { key: 'event_type_text', label: '事件类型', width: 120 },
    { key: 'provider', label: '服务商', width: 100 },
    { key: 'process_status_text', label: '处理状态', width: 120 },
    { key: 'error_message', label: '错误信息' },
    { key: 'created_at', label: '创建时间', width: 180 },
  ])
  const searchFields = computed<SearchField[]>(() => [
    { key: 'order_no', type: 'input', label: '支付订单号', placeholder: '支付订单号', width: 210 },
    { key: 'out_trade_no', type: 'input', label: '商户单号', placeholder: '商户单号', width: 210 },
    { key: 'event_type', type: 'input', label: '事件类型', placeholder: '事件类型', width: 120 },
  ])

  function onSearch() {
    table.resetPage()
    void table.getList()
  }

  onMounted(() => {
    void table.getList()
  })

  return { ...table, columns, searchFields, searchForm, onSearch }
}
