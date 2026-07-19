import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import {
  PaymentRechargeApi,
  type PaymentRechargeCreatePayload,
  type PaymentRechargeInitResponse,
  type PaymentRechargeListItem,
  type PaymentRechargeListParams,
  type PaymentRechargePayMethod,
} from '@/api/payment/recharges'
import { useTable } from '@/components/Table'
import { useUserStore } from '@/store/user'
import type { SearchField, SearchFormModel } from '@/components/Search/types'
import { getNativeBridge } from '@/adapters/native'

export type PaymentRechargeSearchForm = PaymentRechargeListParams & SearchFormModel & {
  dateRange: string[]
}

export function usePaymentRechargePage() {
  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  const { t } = useI18n()
  const native = getNativeBridge()
  const activeTab = ref('cashier')
  const pageLoading = ref(false)
  const submitting = ref(false)
  const wallet = shallowRef<PaymentRechargeInitResponse['wallet']>(emptyWallet())
  const packages = shallowRef<PaymentRechargeInitResponse['packages']>([])
  const paymentMethod = shallowRef<PaymentRechargeInitResponse['payment_method']>({
    provider: 'alipay',
    label: t('paymentRecharge.provider.alipay'),
    enabled: false,
  })
  const dict = shallowRef<PaymentRechargeInitResponse['dict']>({ status_arr: [] })
  const recent = shallowRef<PaymentRechargeListItem[]>([])
  const selectedPackageCode = ref('')
  const searchForm = ref<PaymentRechargeSearchForm>({
    current_page: 1,
    page_size: 10,
    keyword: '',
    status: '',
    date_start: '',
    date_end: '',
    dateRange: [],
  })
  const apiSearchForm = computed<PaymentRechargeListParams>(() => {
    const [dateStart, dateEnd] = searchForm.value.dateRange
    return {
      current_page: searchForm.value.current_page,
      page_size: searchForm.value.page_size,
      keyword: searchForm.value.keyword,
      status: searchForm.value.status,
      date_start: dateStart || '',
      date_end: dateEnd || '',
    }
  })
  const table = useTable<PaymentRechargeListItem, PaymentRechargeListParams>({
    api: PaymentRechargeApi,
    searchForm: apiSearchForm,
    initPage: { page_size: 10 },
  })
  const selectedPackage = computed(() => packages.value.find((item) => item.code === selectedPackageCode.value))
  const canCreateRecharge = computed(() => userStore.can('payment_recharge_add'))
  const balanceAfterText = computed(() => {
    const amount = selectedPackage.value?.amount_cents ?? 0
    return centsText(wallet.value.balance_cents + amount)
  })
  const canSubmit = computed(() => Boolean(canCreateRecharge.value && selectedPackage.value && paymentMethod.value.enabled && !submitting.value))
  const columns = computed(() => [
    { key: 'recharge_no', label: t('paymentRecharge.columns.rechargeNo'), minWidth: 190 },
    { key: 'payment_order_no', label: t('paymentRecharge.columns.paymentOrderNo'), minWidth: 190 },
    { key: 'package_name', label: t('paymentRecharge.columns.package'), minWidth: 100 },
    { key: 'amount_text', label: t('paymentRecharge.columns.amount'), width: 110 },
    { key: 'status_text', label: t('paymentRecharge.columns.status'), width: 110 },
    { key: 'paid_at', label: t('paymentRecharge.columns.paidAt'), minWidth: 170 },
    { key: 'credited_at', label: t('paymentRecharge.columns.creditedAt'), minWidth: 170 },
    { key: 'created_at', label: t('paymentRecharge.columns.createdAt'), minWidth: 170 },
    { key: 'actions', label: t('paymentRecharge.columns.actions'), width: 240, fixed: 'right' },
  ])
  const searchFields = computed<SearchField[]>(() => [
    { key: 'keyword', type: 'input', label: t('paymentRecharge.filters.keyword'), placeholder: t('paymentRecharge.filters.keywordPlaceholder'), width: 210 },
    { key: 'status', type: 'select-v2', label: t('paymentRecharge.filters.status'), placeholder: t('paymentRecharge.filters.status'), width: 130, options: dict.value.status_arr },
    { key: 'dateRange', type: 'date-range', label: t('paymentRecharge.filters.dateRange'), width: 260 },
  ])

  async function init() {
    pageLoading.value = true
    try {
      const result = await PaymentRechargeApi.pageInit()
      wallet.value = result.wallet
      packages.value = result.packages
      paymentMethod.value = result.payment_method
      dict.value = result.dict
      recent.value = result.recent
      const firstPackage = result.packages[0]
      if (!selectedPackageCode.value && firstPackage) {
        selectedPackageCode.value = firstPackage.code
      }
    } finally {
      pageLoading.value = false
    }
  }

  async function refreshAll() {
    await init()
    await table.getList()
  }

  function selectPackage(code: string) {
    selectedPackageCode.value = code
  }

  async function createRecharge() {
    if (!canSubmit.value) return
    submitting.value = true
    try {
      const result = await PaymentRechargeApi.create(buildCreatePayload(selectedPackage.value!.code))
      if (result.pay_url) {
        native.window.navigateExternal(result.pay_url)
        return
      }
      ElNotification.success({ message: t('paymentRecharge.messages.created') })
      await refreshAll()
    } finally {
      submitting.value = false
    }
  }

  async function payRecharge(row: PaymentRechargeListItem) {
    if (row.status === 'paying' && row.pay_url !== '') {
      native.window.navigateExternal(row.pay_url)
      return
    }
    const result = await PaymentRechargeApi.pay(row.id)
    if (result.pay_url) {
      native.window.navigateExternal(result.pay_url)
      return
    }
    await refreshAll()
  }

  function onSearch() {
    table.resetPage()
    void table.getList()
  }

  function canPay(row: PaymentRechargeListItem) {
    return row.status === 'pending' || row.status === 'failed' || (row.status === 'paying' && row.pay_url !== '')
  }

  function buildCreatePayload(packageCode: string): PaymentRechargeCreatePayload {
    return {
      package_code: packageCode,
      pay_method: browserPayMethod(),
      return_url: rechargeReturnURL(),
    }
  }

  function rechargeReturnURL() {
    const resolved = router.resolve({ path: '/payment/recharge' }).href
    return `${window.location.origin}${resolved}`
  }

  watch(
    () => route.query,
    (query) => {
      if (query.tab === 'records') {
        activeTab.value = 'records'
      }
    },
    { immediate: true },
  )

  onMounted(() => {
    void refreshAll()
  })

  return {
    ...table,
    activeTab,
    pageLoading,
    submitting,
    wallet,
    packages,
    paymentMethod,
    recent,
    selectedPackageCode,
    selectedPackage,
    canCreateRecharge,
    balanceAfterText,
    canSubmit,
    columns,
    searchFields,
    searchForm,
    init,
    refreshAll,
    selectPackage,
    createRecharge,
    payRecharge,
    onSearch,
    canPay,
    buildCreatePayload,
    rechargeReturnURL,
  }
}

function browserPayMethod(): PaymentRechargePayMethod {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent) ? 'h5' : 'web'
}

function centsText(cents: number) {
  const sign = cents < 0 ? '-' : ''
  const value = Math.abs(cents)
  return `${sign}${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`
}

function emptyWallet(): PaymentRechargeInitResponse['wallet'] {
  return {
    balance_cents: 0,
    balance_text: '¥0.00',
    total_recharge_cents: 0,
    total_recharge_text: '¥0.00',
    total_consume_cents: 0,
    total_consume_text: '¥0.00',
  }
}
