import { computed, onMounted, ref, shallowRef } from 'vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import {
  PaymentOrderApi,
  type PaymentOrderDetail,
  type PaymentOrderInitResponse,
  type PaymentOrderListItem,
  type PaymentOrderListParams,
} from '@/api/payment/orders'
import { useTable } from '@/components/Table'
import type { SearchField } from '@/components/Search/types'

type PaymentOrderSearchForm = PaymentOrderListParams & {
  dateRange: string[]
}

export function usePaymentOrderPage() {
  const dict = shallowRef<PaymentOrderInitResponse['dict']>({
    provider_arr: [],
    pay_method_arr: [],
    order_status_arr: [],
  })
  const configOptions = shallowRef<PaymentOrderInitResponse['config_options']>([])
  const searchForm = ref<PaymentOrderSearchForm>({
    current_page: 1,
    page_size: 20,
    keyword: '',
    config_code: '',
    provider: '',
    pay_method: '',
    status: '',
    date_start: '',
    date_end: '',
    dateRange: [],
  })
  const apiSearchForm = computed<PaymentOrderListParams>(() => {
    const [dateStart, dateEnd] = searchForm.value.dateRange
    return {
      current_page: searchForm.value.current_page,
      page_size: searchForm.value.page_size,
      keyword: searchForm.value.keyword,
      config_code: searchForm.value.config_code,
      provider: searchForm.value.provider,
      pay_method: searchForm.value.pay_method,
      status: searchForm.value.status,
      date_start: dateStart || '',
      date_end: dateEnd || '',
    }
  })
  const table = useTable<PaymentOrderListItem, PaymentOrderListParams>({ api: PaymentOrderApi, searchForm: apiSearchForm })
  const columns = computed(() => [
    { key: 'order_no', label: '订单号', minWidth: 190 },
    { key: 'config_code', label: '配置编码', minWidth: 140 },
    { key: 'provider_text', label: '支付渠道', width: 110 },
    { key: 'pay_method_text', label: '支付方式', width: 110 },
    { key: 'subject', label: '订单标题', minWidth: 180 },
    { key: 'amount_text', label: '金额', width: 110 },
    { key: 'status_text', label: '状态', width: 110 },
    { key: 'expired_at', label: '过期时间', minWidth: 170 },
    { key: 'created_at', label: '创建时间', minWidth: 170 },
    { key: 'actions', label: '操作', width: 260, fixed: 'right' },
  ])
  const searchFields = computed<SearchField[]>(() => [
    { key: 'keyword', type: 'input', label: '关键词', placeholder: '订单号/标题', width: 190 },
    { key: 'config_code', type: 'select-v2', label: '支付配置', placeholder: '支付配置', width: 180, options: configOptions.value },
    { key: 'provider', type: 'select-v2', label: '支付渠道', placeholder: '支付渠道', width: 130, options: dict.value.provider_arr },
    { key: 'pay_method', type: 'select-v2', label: '支付方式', placeholder: '支付方式', width: 130, options: dict.value.pay_method_arr },
    { key: 'status', type: 'select-v2', label: '订单状态', placeholder: '订单状态', width: 130, options: dict.value.order_status_arr },
    { key: 'dateRange', type: 'date-range', label: '创建日期', width: 260 },
  ])
  const detailDialogVisible = ref(false)
  const detail = ref<PaymentOrderDetail | null>(null)
  const detailLoading = ref(false)



  async function init() {
    const res = await PaymentOrderApi.init()
    dict.value = res.dict
    configOptions.value = res.config_options
  }

  async function refresh() {
    await table.getList()
  }

  function onSearch() {
    table.resetPage()
    void table.getList()
  }

  async function openDetailDialog(row: PaymentOrderListItem) {
    detailDialogVisible.value = true
    detailLoading.value = true
    detail.value = null
    try {
      detail.value = await PaymentOrderApi.detail(row.id)
    } finally {
      detailLoading.value = false
    }
  }

  async function payOrder(row: PaymentOrderListItem) {
    if (row.status === 'paying' && row.pay_url !== '') {
      openPayURL(row.pay_url)
      return
    }
    const result = await PaymentOrderApi.pay(row.id)
    ElNotification.success({ message: result.pay_url ? '支付链接已生成' : '操作成功' })
    if (result.pay_url) {
      openPayURL(result.pay_url)
    }
    await table.getList()
  }

  async function syncOrder(row: PaymentOrderListItem) {
    await PaymentOrderApi.sync(row.id)
    ElNotification.success({ message: '同步成功' })
    await table.getList()
  }

  async function closeOrder(row: PaymentOrderListItem) {
    try {
      await ElMessageBox.confirm('确认关闭该支付订单？', '提示', {
        type: 'warning',
        confirmButtonText: '关闭',
        cancelButtonText: '取消',
      })
    } catch {
      return
    }
    await PaymentOrderApi.close(row.id)
    ElNotification.success({ message: '关闭成功' })
    await table.getList()
  }

  function canPay(row: PaymentOrderListItem) {
    return row.status === 'pending' || row.status === 'failed' || (row.status === 'paying' && row.pay_url !== '')
  }

  function canClose(row: PaymentOrderListItem) {
    return row.status === 'pending' || row.status === 'failed' || row.status === 'paying'
  }

  onMounted(() => {
    void init()
    void table.getList()
  })

  return {
    ...table,
    dict,
    configOptions,
    columns,
    searchFields,
    searchForm,
    detailDialogVisible,
    detail,
    detailLoading,
    init,
    refresh,
    onSearch,
    openDetailDialog,
    payOrder,
    syncOrder,
    closeOrder,
    canPay,
    canClose,
  }
}

function openPayURL(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
