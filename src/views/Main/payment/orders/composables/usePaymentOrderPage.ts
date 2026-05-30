import { computed, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
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
  const { t } = useI18n()
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
    { key: 'order_no', label: t('paymentOrder.columns.orderNo'), minWidth: 190 },
    { key: 'config_code', label: t('paymentOrder.columns.configCode'), minWidth: 140 },
    { key: 'provider_text', label: t('paymentOrder.columns.provider'), width: 110 },
    { key: 'pay_method_text', label: t('paymentOrder.columns.payMethod'), width: 110 },
    { key: 'subject', label: t('paymentOrder.columns.subject'), minWidth: 180 },
    { key: 'amount_text', label: t('paymentOrder.columns.amount'), width: 110 },
    { key: 'status_text', label: t('paymentOrder.columns.status'), width: 110 },
    { key: 'expired_at', label: t('paymentOrder.columns.expiredAt'), minWidth: 170 },
    { key: 'created_at', label: t('paymentOrder.columns.createdAt'), minWidth: 170 },
    { key: 'actions', label: t('paymentOrder.columns.actions'), width: 260, fixed: 'right' },
  ])
  const searchFields = computed<SearchField[]>(() => [
    { key: 'keyword', type: 'input', label: t('paymentOrder.filters.keyword'), placeholder: t('paymentOrder.filters.keywordPlaceholder'), width: 190 },
    { key: 'config_code', type: 'select-v2', label: t('paymentOrder.filters.configCode'), placeholder: t('paymentOrder.filters.configCode'), width: 180, options: configOptions.value },
    { key: 'provider', type: 'select-v2', label: t('paymentOrder.filters.provider'), placeholder: t('paymentOrder.filters.provider'), width: 130, options: dict.value.provider_arr },
    { key: 'pay_method', type: 'select-v2', label: t('paymentOrder.filters.payMethod'), placeholder: t('paymentOrder.filters.payMethod'), width: 130, options: dict.value.pay_method_arr },
    { key: 'status', type: 'select-v2', label: t('paymentOrder.filters.status'), placeholder: t('paymentOrder.filters.status'), width: 130, options: dict.value.order_status_arr },
    { key: 'dateRange', type: 'date-range', label: t('paymentOrder.filters.dateRange'), width: 260 },
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
    ElNotification.success({ message: result.pay_url ? t('paymentOrder.messages.payLinkGenerated') : t('common.success.operation') })
    if (result.pay_url) {
      openPayURL(result.pay_url)
    }
    await table.getList()
  }

  async function syncOrder(row: PaymentOrderListItem) {
    await PaymentOrderApi.sync(row.id)
    ElNotification.success({ message: t('paymentOrder.messages.syncSuccess') })
    await table.getList()
  }

  async function closeOrder(row: PaymentOrderListItem) {
    try {
      await ElMessageBox.confirm(t('paymentOrder.messages.closeConfirm'), t('common.confirmTitle'), {
        type: 'warning',
        confirmButtonText: t('paymentOrder.actions.close'),
        cancelButtonText: t('common.actions.cancel'),
      })
    } catch {
      return
    }
    await PaymentOrderApi.close(row.id)
    ElNotification.success({ message: t('paymentOrder.messages.closeSuccess') })
    await table.getList()
  }

  function canPay(row: PaymentOrderListItem) {
    return row.status === 'pending' || row.status === 'failed' || (row.status === 'paying' && row.pay_url !== '')
  }

  function canSync(row: PaymentOrderListItem) {
    return row.status === 'paying'
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
    canSync,
    canClose,
  }
}

function openPayURL(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
