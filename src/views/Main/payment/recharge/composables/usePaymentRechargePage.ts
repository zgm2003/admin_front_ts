import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElNotification } from 'element-plus'
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

export type PaymentRechargeSearchForm = PaymentRechargeListParams & SearchFormModel & {
  dateRange: string[]
}

export function usePaymentRechargePage() {
  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  const activeTab = ref('cashier')
  const pageLoading = ref(false)
  const submitting = ref(false)
  const wallet = shallowRef<PaymentRechargeInitResponse['wallet']>(emptyWallet())
  const packages = shallowRef<PaymentRechargeInitResponse['packages']>([])
  const paymentMethod = shallowRef<PaymentRechargeInitResponse['payment_method']>({
    provider: 'alipay',
    label: '支付宝',
    enabled: false,
  })
  const dict = shallowRef<PaymentRechargeInitResponse['dict']>({ status_arr: [] })
  const recent = shallowRef<PaymentRechargeListItem[]>([])
  const selectedPackageCode = ref('')
  const syncedReturnRechargeNo = shallowRef('')
  const autoSyncedRechargeIDs = shallowRef(new Set<number>())
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
  const balanceAfterText = computed(() => {
    const amount = selectedPackage.value?.amount_cents ?? 0
    return centsText(wallet.value.balance_cents + amount)
  })
  const canSubmit = computed(() => Boolean(selectedPackage.value && paymentMethod.value.enabled && !submitting.value))
  const columns = computed(() => [
    { key: 'recharge_no', label: '充值单号', minWidth: 190 },
    { key: 'payment_order_no', label: '支付订单号', minWidth: 190 },
    { key: 'package_name', label: '套餐', minWidth: 100 },
    { key: 'amount_text', label: '金额', width: 110 },
    { key: 'status_text', label: '状态', width: 110 },
    { key: 'paid_at', label: '支付时间', minWidth: 170 },
    { key: 'credited_at', label: '入账时间', minWidth: 170 },
    { key: 'created_at', label: '创建时间', minWidth: 170 },
    { key: 'actions', label: '操作', width: 240, fixed: 'right' },
  ])
  const searchFields = computed<SearchField[]>(() => [
    { key: 'keyword', type: 'input', label: '关键词', placeholder: '充值单号/支付订单号', width: 210 },
    { key: 'status', type: 'select-v2', label: '状态', placeholder: '状态', width: 130, options: dict.value.status_arr },
    { key: 'dateRange', type: 'date-range', label: '创建日期', width: 260 },
  ])

  async function init() {
    pageLoading.value = true
    try {
      const result = await PaymentRechargeApi.init()
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
    await autoSyncVisiblePayingRecharges()
  }

  function selectPackage(code: string) {
    selectedPackageCode.value = code
  }

  async function createRecharge() {
    if (!selectedPackage.value) return
    submitting.value = true
    try {
      const result = await PaymentRechargeApi.add(buildCreatePayload(selectedPackage.value.code))
      if (result.pay_url) {
        window.location.href = result.pay_url
        return
      }
      ElNotification.success({ message: '充值单已创建' })
      await refreshAll()
    } finally {
      submitting.value = false
    }
  }

  async function payRecharge(row: PaymentRechargeListItem) {
    if (row.status === 'paying' && row.pay_url !== '') {
      window.location.href = row.pay_url
      return
    }
    const result = await PaymentRechargeApi.pay(row.id)
    if (result.pay_url) {
      window.location.href = result.pay_url
      return
    }
    await refreshAll()
  }

  async function syncRecharge(row: PaymentRechargeListItem) {
    const result = await PaymentRechargeApi.sync(row.id)
    wallet.value = result.wallet
    ElNotification.success({ message: '同步成功' })
    await refreshAll()
  }

  async function closeRecharge(row: PaymentRechargeListItem) {
    try {
      await ElMessageBox.confirm('确认关闭该充值单？', '提示', {
        type: 'warning',
        confirmButtonText: '关闭',
        cancelButtonText: '取消',
      })
    } catch {
      return
    }
    const result = await PaymentRechargeApi.close(row.id)
    wallet.value = result.wallet
    ElNotification.success({ message: '关闭成功' })
    await refreshAll()
  }

  function onSearch() {
    table.resetPage()
    void table.getList()
  }

  function canPay(row: PaymentRechargeListItem) {
    return row.status === 'pending' || row.status === 'failed' || (row.status === 'paying' && row.pay_url !== '')
  }

  function canSync(row: PaymentRechargeListItem) {
    return row.status === 'paying' || row.status === 'paid'
  }

  function canClose(row: PaymentRechargeListItem) {
    return row.status === 'pending' || row.status === 'failed' || row.status === 'paying'
  }

  async function autoSyncVisiblePayingRecharges() {
    if (!userStore.can('payment_recharge_sync')) return
    const candidates = table.data.value
      .filter((item) => item.status === 'paying' && !autoSyncedRechargeIDs.value.has(item.id))
      .slice(0, 3)
    if (candidates.length === 0) return

    let changed = false
    for (const row of candidates) {
      autoSyncedRechargeIDs.value.add(row.id)
      try {
        const result = await PaymentRechargeApi.sync(row.id)
        wallet.value = result.wallet
        changed = true
      } catch {
        ElNotification.warning({ message: '部分支付中充值单自动同步失败，可稍后手动同步' })
      }
    }
    if (changed) {
      await init()
      await table.getList()
    }
  }

  async function syncReturnRecharge(rechargeNo: string) {
    const normalized = rechargeNo.trim()
    if (!normalized || syncedReturnRechargeNo.value === normalized) return
    syncedReturnRechargeNo.value = normalized
    try {
      const result = await PaymentRechargeApi.list({
        current_page: 1,
        page_size: 1,
        keyword: normalized,
      })
      const row = result.list.find((item) => item.recharge_no === normalized)
      if (!row) {
        await table.getList()
        return
      }
      const status = await PaymentRechargeApi.sync(row.id)
      wallet.value = status.wallet
      await refreshAll()
    } catch {
      ElNotification.warning({ message: '支付结果自动同步失败，可稍后在充值记录中手动同步' })
      await table.getList()
    }
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
      if (typeof query.recharge_no === 'string' && query.recharge_no !== '') {
        void syncReturnRecharge(query.recharge_no)
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
    syncRecharge,
    closeRecharge,
    onSearch,
    canPay,
    canSync,
    canClose,
    autoSyncVisiblePayingRecharges,
    syncReturnRecharge,
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
