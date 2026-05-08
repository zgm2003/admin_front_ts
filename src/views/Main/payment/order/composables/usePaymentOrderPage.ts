import { computed, onMounted, ref } from 'vue'
import { ElNotification } from 'element-plus'
import {
  PaymentOrderApi,
  type PaymentOrderInitResponse,
  type PaymentOrderListItem,
  type PaymentOrderListParams,
} from '@/api/payment/order'
import { useTable } from '@/components/Table'
import type { SearchField } from '@/components/Search/types'

export function usePaymentOrderPage() {
  const statusArr = ref<PaymentOrderInitResponse['dict']['common_status_arr']>([])
  const searchForm = ref<PaymentOrderListParams>({
    current_page: 1,
    page_size: 20,
    order_no: '',
    user_id: '',
    status: '',
  })
  const table = useTable<PaymentOrderListItem, PaymentOrderListParams>({ api: PaymentOrderApi, searchForm })
  const columns = computed(() => [
    { key: 'order_no', label: '支付订单号', width: 210 },
    { key: 'user_id', label: '用户ID', width: 100 },
    { key: 'subject', label: '标题' },
    { key: 'amount_cents', label: '金额(分)', width: 120 },
    { key: 'status_text', label: '状态', width: 120 },
    { key: 'out_trade_no', label: '商户单号', width: 210 },
    { key: 'trade_no', label: '支付宝交易号', width: 210 },
    { key: 'created_at', label: '创建时间', width: 180 },
    { key: 'actions', label: '操作', width: 120 },
  ])
  const searchFields = computed<SearchField[]>(() => [
    { key: 'order_no', type: 'input', label: '支付订单号', placeholder: '支付订单号', width: 210 },
    { key: 'user_id', type: 'input', label: '用户ID', placeholder: '用户ID', width: 120 },
    { key: 'status', type: 'select-v2', label: '状态', placeholder: '状态', width: 120, options: statusArr.value },
  ])

  async function init() {
    const res = await PaymentOrderApi.init()
    statusArr.value = res.dict.common_status_arr
  }

  async function close(row: PaymentOrderListItem) {
    await PaymentOrderApi.close(row.order_no)
    ElNotification.success({ message: '操作成功' })
    await table.getList()
  }

  function onSearch() {
    table.resetPage()
    void table.getList()
  }

  onMounted(() => {
    void init()
    void table.getList()
  })

  return { ...table, columns, searchFields, searchForm, onSearch, close }
}
