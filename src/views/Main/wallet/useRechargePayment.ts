import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import QRCode from 'qrcode'
import { ElMessageBox, ElNotification } from 'element-plus'
import { BizStatus, CommonEnum, PayChannel, PayStatus } from '@/enums'
import { PayChannelApi } from '@/api/pay/channel'
import { OrderApi } from '@/api/pay/order'
import { useUserStore } from '@/store/user'
import { useI18n } from 'vue-i18n'
import type { DictOption } from '@/types/common'
import type {
  RechargeOrderState,
  RechargeOrderListItem,
  RechargePaymentView,
  RechargePresetOption,
  WalletSummaryItem,
  WalletTransactionItem,
  WalletTransactionPage,
} from './types'

const DEFAULT_PAGE: WalletTransactionPage = {
  current_page: 1,
  page_size: 10,
  total: 0,
  total_page: 0,
}

const PAY_CHANNEL_FETCH_SIZE = 50
const POLL_INTERVAL = 3000
const MAX_POLL_COUNT = 60
const WINDOW_PAY_METHODS = ['web', 'h5']

const isOngoingPayStatus = (status?: number | null) =>
  status === PayStatus.PENDING || status === PayStatus.PAYING

const normalizeNumberOptions = (source: unknown): DictOption<number>[] => {
  if (Array.isArray(source)) {
    return source
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          const option = item as Partial<DictOption<number | string>>
          return {
            label: String(option.label ?? option.value ?? ''),
            value: Number(option.value ?? 0),
          }
        }

        return null
      })
      .filter((item): item is DictOption<number> => item !== null && Number.isFinite(item.value))
  }

  if (source && typeof source === 'object') {
    return Object.entries(source).map(([value, label]) => ({
      label: String(label),
      value: Number(value),
    }))
  }

  return []
}

const normalizeStringOptions = (source: unknown): DictOption<string>[] => {
  if (Array.isArray(source)) {
    return source
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          const option = item as Partial<DictOption<string | number>>
          return {
            label: String(option.label ?? option.value ?? ''),
            value: String(option.value ?? ''),
          }
        }

        return null
      })
      .filter((item): item is DictOption<string> => item !== null && item.value !== '')
  }

  if (source && typeof source === 'object') {
    return Object.entries(source).map(([value, label]) => ({
      label: String(label),
      value: String(value),
    }))
  }

  return []
}

const normalizePresetOptions = (source: unknown): RechargePresetOption[] => {
  if (Array.isArray(source)) {
    return source
      .map((item): RechargePresetOption | null => {
        if (typeof item === 'number') {
          return { amount: Number((item / 100).toFixed(2)) }
        }

        if (typeof item === 'object' && item !== null) {
          const option = item as Partial<{ amount: number | string; value: number | string; label: string }>
          const rawAmount = Number(option.amount ?? option.value ?? 0)
          if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
            return null
          }

          return {
            amount: Number((rawAmount / 100).toFixed(2)),
            label: option.label || undefined,
          }
        }

        return null
      })
      .filter((item): item is RechargePresetOption => item !== null)
  }

  if (source && typeof source === 'object') {
    return Object.entries(source)
      .map(([value, label]): RechargePresetOption | null => {
        const amount = Number(value)
        if (!Number.isFinite(amount) || amount <= 0) {
          return null
        }

        return {
          amount: Number((amount / 100).toFixed(2)),
          label: String(label),
        }
      })
      .filter((item): item is RechargePresetOption => item !== null)
  }

  return []
}

const looksLikeHtml = (value: string) => /<(form|html|body|script)\b|<!doctype/i.test(value)
const looksLikeUrl = (value: string) => /^(https?:\/\/|alipays?:\/\/|weixin:\/\/|wxp:\/\/)/i.test(value)
const isWindowPayMethod = (payMethod: string) => WINDOW_PAY_METHODS.includes(payMethod)
const WECHAT_H5_HOST = 'wx.tenpay.com'

interface ExternalPaymentAction {
  type: 'html' | 'link'
  content: string
}

interface PayChannelRecord {
  id: number
  name: string
  channel: number
  channel_name?: string
  is_sandbox?: number
  supported_methods?: string[]
}

const resolvePaymentReturnUrl = (): string => {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.location.href
}

const appendWechatRedirectUrl = (url: string, returnUrl: string): string => {
  if (!url || !returnUrl) {
    return url
  }

  try {
    const parsedUrl = new URL(url)
    if (!parsedUrl.hostname.includes(WECHAT_H5_HOST) || parsedUrl.searchParams.has('redirect_url')) {
      return url
    }

    parsedUrl.searchParams.set('redirect_url', returnUrl)
    return parsedUrl.toString()
  } catch {
    return url
  }
}

const withPaymentReturnUrl = (payData: Record<string, unknown>, returnUrl: string): Record<string, unknown> => {
  if (!returnUrl) {
    return payData
  }

  const nextPayData: Record<string, unknown> = { ...payData }
  const urlFields = ['h5_url', 'h5Url', 'mweb_url', 'mwebUrl', 'url', 'link', 'pay_link', 'payUrl', 'content']

  for (const field of urlFields) {
    const fieldValue = nextPayData[field]
    if (typeof fieldValue !== 'string' || !looksLikeUrl(fieldValue)) {
      continue
    }

    nextPayData[field] = appendWechatRedirectUrl(fieldValue, returnUrl)
  }

  return nextPayData
}

export function useRechargePayment() {
  const { t } = useI18n()
  const userStore = useUserStore()
  const userId = computed(() => {
    const value = Number(userStore.user_id)
    return Number.isFinite(value) && value > 0 ? value : 0
  })

  const summaryLoading = shallowRef(false)
  const historyLoading = shallowRef(false)
  const initLoading = shallowRef(false)
  const submitting = shallowRef(false)
  const statusChecking = shallowRef(false)
  const cancelingOrder = shallowRef(false)
  const paymentDialogVisible = shallowRef(false)
  const popupBlocked = shallowRef(false)
  const orderLoading = shallowRef(false)
  const recentOrdersLoading = shallowRef(false)

  const wallet = ref<WalletSummaryItem | null>(null)
  const transactions = ref<WalletTransactionItem[]>([])
  const transactionPage = ref<WalletTransactionPage>({ ...DEFAULT_PAGE })
  const rechargeOrders = ref<RechargeOrderListItem[]>([])
  const recentRechargeOrders = ref<RechargeOrderListItem[]>([])
  const orderPage = ref<WalletTransactionPage>({ ...DEFAULT_PAGE })

  const channelRecords = ref<PayChannelRecord[]>([])
  const channelOptions = ref<DictOption<number>[]>([])
  const payMethodOptions = ref<DictOption<string>[]>([])
  const payStatusOptions = ref<DictOption<number>[]>([])
  const bizStatusOptions = ref<DictOption<number>[]>([])
  const presetAmounts = ref<RechargePresetOption[]>([])

  const rechargeAmount = shallowRef<number | null>(null)
  const selectedChannelId = shallowRef<number | null>(null)
  const selectedPayMethod = shallowRef('')

  const currentOrder = ref<RechargeOrderState | null>(null)
  const paymentView = ref<RechargePaymentView | null>(null)
  const externalPayment = ref<ExternalPaymentAction | null>(null)

  const selectedChannelRecord = computed(
    () => channelRecords.value.find((item) => item.id === selectedChannelId.value) ?? null,
  )
  const channelLabelMap = computed(() => new Map(channelOptions.value.map((item) => [String(item.value), item.label])))
  const payMethodLabelMap = computed(() => new Map(payMethodOptions.value.map((item) => [String(item.value), item.label])))
  const payStatusLabelMap = computed(() => new Map(payStatusOptions.value.map((item) => [String(item.value), item.label])))
  const bizStatusLabelMap = computed(() => new Map(bizStatusOptions.value.map((item) => [String(item.value), item.label])))

  const availableChannelOptions = computed(() => channelOptions.value)
  const availablePayMethodOptions = computed(() => {
    const supported = new Set(selectedChannelRecord.value?.supported_methods ?? [])
    const filtered = payMethodOptions.value.filter((item) => supported.has(String(item.value)))
    return filtered.length > 0 ? filtered : payMethodOptions.value
  })

  const mapOrderRowToState = (row: RechargeOrderListItem): RechargeOrderState => {
    const payMethod = row.pay_method ?? ''
    const channelId = Number(row.channel_id ?? 0)
    const channelName = ((row as RechargeOrderListItem & { channel_name?: string | null }).channel_name ?? '').trim()
    const channelText = channelName || (channelId ? channelLabelMap.value.get(String(channelId)) ?? '' : '')
    return {
      orderNo: row.order_no,
      payAmount: Number(row.pay_amount ?? 0),
      channelId,
      channelText,
      payMethod,
      payMethodText: row.pay_method_text || payMethodLabelMap.value.get(payMethod) || payMethod,
      payStatus: row.pay_status,
      payStatusText: row.pay_status_text,
      bizStatus: row.biz_status,
      bizStatusText: row.biz_status_text,
      expireTime: row.expire_time ?? undefined,
      payTime: row.pay_time ?? null,
      transactionNo: row.transaction_no ?? null,
      transactionStatus: row.transaction_status ?? null,
    }
  }

  const mergeCurrentOrder = (nextOrder: RechargeOrderState) => {
    if (!currentOrder.value || currentOrder.value.orderNo !== nextOrder.orderNo) {
      currentOrder.value = nextOrder
      return
    }

    const current = currentOrder.value
    currentOrder.value = {
      ...current,
      ...nextOrder,
      channelId: nextOrder.channelId > 0 ? nextOrder.channelId : current.channelId,
      channelText: nextOrder.channelText || current.channelText,
      payMethod: nextOrder.payMethod || current.payMethod,
      payMethodText: nextOrder.payMethodText || current.payMethodText,
      payStatusText: nextOrder.payStatusText || current.payStatusText,
      bizStatusText: nextOrder.bizStatusText || current.bizStatusText,
      expireTime: nextOrder.expireTime || current.expireTime,
      payTime: nextOrder.payTime ?? current.payTime,
      transactionNo: nextOrder.transactionNo ?? current.transactionNo,
      transactionStatus: nextOrder.transactionStatus ?? current.transactionStatus,
    }
  }

  const updateRechargeOrderRow = (orderNo: string, patch: Partial<RechargeOrderListItem>) => {
    rechargeOrders.value = rechargeOrders.value.map((item) =>
      item.order_no === orderNo ? { ...item, ...patch } : item,
    )
    recentRechargeOrders.value = recentRechargeOrders.value.map((item) =>
      item.order_no === orderNo ? { ...item, ...patch } : item,
    )
  }

  const canRecharge = computed(() =>
    userId.value > 0 &&
    rechargeAmount.value !== null &&
    rechargeAmount.value > 0 &&
    selectedChannelId.value !== null &&
    selectedPayMethod.value !== '' &&
    !initLoading.value,
  )

  const canResumePayment = computed(() => {
    if (!currentOrder.value) {
      return false
    }

    const payStatus = currentOrder.value.payStatus
    return payStatus !== PayStatus.PAID && payStatus !== PayStatus.CLOSED && payStatus !== PayStatus.EXCEPTION
  })

  const canCancelOrder = computed(() => {
    if (!currentOrder.value) {
      return false
    }

    return currentOrder.value.payStatus === PayStatus.PENDING || currentOrder.value.payStatus === PayStatus.PAYING
  })

  const ensureRechargeCreationAllowed = async () => {
    const ongoingCurrentOrder = currentOrder.value
    if (ongoingCurrentOrder && isOngoingPayStatus(ongoingCurrentOrder.payStatus)) {
      try {
        await ElMessageBox.confirm(
          t('personal.recharge.unfinishedOrderConfirm', { orderNo: ongoingCurrentOrder.orderNo }),
          t('common.confirmTitle'),
          {
            type: 'warning',
            confirmButtonText: t('personal.recharge.continuePay'),
            cancelButtonText: t('common.actions.cancel'),
          },
        )
      } catch {
        return false
      }

      await resumePayment()
      return false
    }

    const ongoingOrder = rechargeOrders.value.find((item) => isOngoingPayStatus(item.pay_status))
    if (!ongoingOrder) {
      return true
    }

    selectRechargeOrder(ongoingOrder)

    try {
      await ElMessageBox.confirm(
        t('personal.recharge.unfinishedOrderConfirm', { orderNo: ongoingOrder.order_no }),
        t('common.confirmTitle'),
        {
          type: 'warning',
          confirmButtonText: t('personal.recharge.continuePay'),
          cancelButtonText: t('common.actions.cancel'),
        },
      )
    } catch {
      return false
    }

    await resumePayment()
    return false
  }

  let pollTimer: number | null = null
  let pollCount = 0

  const setDefaultAmount = () => {
    if (rechargeAmount.value && rechargeAmount.value > 0) {
      return
    }

    rechargeAmount.value = presetAmounts.value[0]?.amount ?? 10
  }

  const syncSelections = () => {
    if (availableChannelOptions.value.length === 0) {
      selectedChannelId.value = null
      selectedPayMethod.value = ''
      return
    }

    const hasCurrentChannel = channelRecords.value.some((item) => item.id === selectedChannelId.value)
    if (!hasCurrentChannel) {
      const alipayChannel = channelRecords.value.find((item) => item.channel === PayChannel.ALIPAY)
      selectedChannelId.value = alipayChannel?.id ?? channelRecords.value[0]?.id ?? null
    }

    const hasCurrentMethod = availablePayMethodOptions.value.some((item) => item.value === selectedPayMethod.value)
    if (!hasCurrentMethod) {
      selectedPayMethod.value = availablePayMethodOptions.value[0]?.value ?? ''
    }
  }

  const stopPolling = () => {
    if (pollTimer !== null) {
      window.clearTimeout(pollTimer)
      pollTimer = null
    }

    pollCount = 0
  }

  const resetPaymentPresentation = () => {
    paymentView.value = null
    externalPayment.value = null
    paymentDialogVisible.value = false
  }

  const loadInit = async () => {
    initLoading.value = true
    try {
      const [initData, channelData] = await Promise.all([
        OrderApi.init(),
        PayChannelApi.list({
          page: 1,
          page_size: PAY_CHANNEL_FETCH_SIZE,
          status: CommonEnum.YES,
        }),
      ])

      const records: PayChannelRecord[] = Array.isArray(channelData.list)
        ? (channelData.list as unknown[])
            .map((item: unknown): PayChannelRecord | null => {
              if (!item || typeof item !== 'object') {
                return null
              }

              const record = item as Partial<PayChannelRecord>
              const id = Number(record.id ?? 0)
              const channel = Number(record.channel ?? 0)
              const name = String(record.name ?? '').trim()
              if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(channel) || channel <= 0 || name === '') {
                return null
              }

              return {
                id,
                name,
                channel,
                channel_name: typeof record.channel_name === 'string' ? record.channel_name.trim() : '',
                is_sandbox: Number(record.is_sandbox ?? CommonEnum.NO),
                supported_methods: Array.isArray((record as { supported_methods?: unknown }).supported_methods)
                  ? ((record as { supported_methods?: unknown[] }).supported_methods ?? [])
                      .map((method) => String(method ?? ''))
                      .filter((method) => method !== '')
                  : [],
              }
            })
            .filter((item: PayChannelRecord | null): item is PayChannelRecord => item !== null)
        : []

      channelRecords.value = records
      channelOptions.value = records.map((item: PayChannelRecord) => {
        const detailParts = [item.channel_name].filter((value: string | undefined): value is string => Boolean(value))
        if (item.is_sandbox === CommonEnum.YES) {
          detailParts.push(t('pay_channel.table.is_sandbox'))
        }

        return {
          label: detailParts.length > 0 ? `${item.name} (${detailParts.join(' · ')})` : item.name,
          value: item.id,
        }
      })
      payMethodOptions.value = normalizeStringOptions(initData.dict?.pay_method_arr)
      payStatusOptions.value = normalizeNumberOptions(initData.dict?.pay_status_arr)
      bizStatusOptions.value = normalizeNumberOptions(initData.dict?.biz_status_arr)
      presetAmounts.value = normalizePresetOptions(initData.dict?.recharge_preset_arr)
      syncSelections()
      setDefaultAmount()
    } finally {
      initLoading.value = false
    }
  }

  const loadWallet = async () => {
    if (!userId.value) {
      wallet.value = null
      return
    }

    summaryLoading.value = true
    try {
      const data = await OrderApi.walletInfo()
      if (Number(data.wallet_exists ?? CommonEnum.YES) !== CommonEnum.YES) {
        wallet.value = null
        return
      }

      const balance = Number(data.balance ?? 0)
      const frozen = Number(data.frozen ?? 0)
      wallet.value = {
        balance,
        frozen,
        total_recharge: Number(data.total_recharge ?? 0),
        total_consume: Number(data.total_consume ?? 0),
        created_at: typeof data.created_at === 'string' ? data.created_at : undefined,
      }
    } finally {
      summaryLoading.value = false
    }
  }

  const loadTransactions = async () => {
    if (!userId.value) {
      transactions.value = []
      transactionPage.value = { ...DEFAULT_PAGE }
      return
    }

    historyLoading.value = true
    try {
      const data = await OrderApi.walletBills({
        page: transactionPage.value.current_page,
        page_size: transactionPage.value.page_size,
      })

      transactions.value = data.list ?? []
      transactionPage.value = {
        ...transactionPage.value,
        ...data.page,
      }
    } finally {
      historyLoading.value = false
    }
  }

  const syncCurrentOrderFromRows = (rows: RechargeOrderListItem[]) => {
    if (!userId.value || rows.length === 0) {
      return
    }

    if (currentOrder.value?.orderNo) {
      const matched = rows.find((item) => item.order_no === currentOrder.value?.orderNo)
      if (matched) {
        mergeCurrentOrder(mapOrderRowToState(matched))

        if (isOngoingPayStatus(matched.pay_status)) {
          schedulePolling()
        } else {
          stopPolling()
        }
      }

      return
    }

    const candidate = rows.find((item) => isOngoingPayStatus(item.pay_status))
    if (!candidate) {
      return
    }

    currentOrder.value = mapOrderRowToState(candidate)
    schedulePolling()
  }

  const loadRechargeOrders = async () => {
    if (!userId.value) {
      rechargeOrders.value = []
      orderPage.value = { ...DEFAULT_PAGE }
      return
    }

    orderLoading.value = true
    try {
      const data = await OrderApi.myOrders({
        page: orderPage.value.current_page,
        page_size: orderPage.value.page_size,
      })

      rechargeOrders.value = Array.isArray(data.list) ? (data.list as RechargeOrderListItem[]) : []
      orderPage.value = {
        ...orderPage.value,
        ...data.page,
      }

      syncCurrentOrderFromRows(rechargeOrders.value)
    } finally {
      orderLoading.value = false
    }
  }

  const loadRecentRechargeOrders = async () => {
    if (!userId.value) {
      recentRechargeOrders.value = []
      return
    }

    recentOrdersLoading.value = true
    try {
      const data = await OrderApi.myOrders({
        page: DEFAULT_PAGE.current_page,
        page_size: DEFAULT_PAGE.page_size,
      })

      recentRechargeOrders.value = Array.isArray(data.list) ? (data.list as RechargeOrderListItem[]) : []
      syncCurrentOrderFromRows(recentRechargeOrders.value)
    } finally {
      recentOrdersLoading.value = false
    }
  }

  const handleOrderPageChange = (page: WalletTransactionPage) => {
    orderPage.value = {
      ...orderPage.value,
      ...page,
    }
    void loadRechargeOrders()
  }

  const reloadData = async () => {
    await Promise.all([loadWallet(), loadTransactions(), loadRechargeOrders(), loadRecentRechargeOrders()])
  }

  const selectRechargeOrder = (order: RechargeOrderListItem) => {
    resetPaymentPresentation()
    popupBlocked.value = false
    mergeCurrentOrder(mapOrderRowToState(order))

    if (isOngoingPayStatus(order.pay_status)) {
      schedulePolling()
      return
    }

    stopPolling()
  }

  const updateOrderStatus = (payload: {
    pay_status?: number
    biz_status?: number
    pay_time?: string | null
    transaction?: {
      transaction_no?: string
      status?: number
    } | null
  }) => {
    if (!currentOrder.value) {
      return
    }

    const payStatus = Number(payload.pay_status ?? currentOrder.value.payStatus)
    const bizStatus = Number(payload.biz_status ?? currentOrder.value.bizStatus)

    currentOrder.value = {
      ...currentOrder.value,
      payStatus,
      payStatusText: payStatusLabelMap.value.get(String(payStatus)) ?? currentOrder.value.payStatusText,
      bizStatus,
      bizStatusText: bizStatusLabelMap.value.get(String(bizStatus)) ?? currentOrder.value.bizStatusText,
      payTime: payload.pay_time ?? currentOrder.value.payTime,
      transactionNo: payload.transaction?.transaction_no ?? currentOrder.value.transactionNo,
      transactionStatus: payload.transaction?.status ?? currentOrder.value.transactionStatus,
    }
  }

  const refreshOrderStatus = async (notifyOnSuccess = false) => {
    if (!currentOrder.value || !userId.value) {
      return
    }

    statusChecking.value = true
    try {
      const data = await OrderApi.queryResult({
        order_no: currentOrder.value.orderNo,
      })

      updateOrderStatus(data)
      const nextPayStatus = Number(data.pay_status ?? currentOrder.value.payStatus)
      const nextBizStatus = Number(data.biz_status ?? currentOrder.value.bizStatus)
      updateRechargeOrderRow(currentOrder.value.orderNo, {
        pay_status: nextPayStatus,
        pay_status_text: payStatusLabelMap.value.get(String(nextPayStatus)) ?? currentOrder.value.payStatusText,
        biz_status: nextBizStatus,
        biz_status_text: bizStatusLabelMap.value.get(String(nextBizStatus)) ?? currentOrder.value.bizStatusText,
        pay_time: data.pay_time ?? currentOrder.value.payTime,
      })

      if (data.pay_status === PayStatus.PAID) {
        stopPolling()
        paymentDialogVisible.value = false
        await reloadData()
        if (notifyOnSuccess) {
          ElNotification.success({ message: t('personal.recharge.paySuccess') })
        }
        return
      }

      if (data.pay_status === PayStatus.CLOSED || data.pay_status === PayStatus.EXCEPTION) {
        stopPolling()
        await Promise.all([loadRechargeOrders(), loadRecentRechargeOrders()])
      }
    } finally {
      statusChecking.value = false
    }
  }

  const cancelOrder = async () => {
    if (!currentOrder.value || !userId.value || !canCancelOrder.value || cancelingOrder.value) {
      return
    }

    try {
      await ElMessageBox.confirm(
        t('personal.recharge.cancelOrderConfirm'),
        t('common.confirmTitle'),
        {
          type: 'warning',
          confirmButtonText: t('common.actions.confirm'),
          cancelButtonText: t('common.actions.cancel'),
        },
      )
    } catch {
      return
    }

    cancelingOrder.value = true

    try {
      await OrderApi.cancelOrder({
        order_no: currentOrder.value.orderNo,
      })

      stopPolling()
      paymentDialogVisible.value = false
      popupBlocked.value = false
      paymentView.value = null
      externalPayment.value = null

      currentOrder.value = {
        ...currentOrder.value,
        payStatus: PayStatus.CLOSED,
        payStatusText: payStatusLabelMap.value.get(String(PayStatus.CLOSED)) ?? currentOrder.value.payStatusText,
      }
      updateRechargeOrderRow(currentOrder.value.orderNo, {
        pay_status: PayStatus.CLOSED,
        pay_status_text: payStatusLabelMap.value.get(String(PayStatus.CLOSED)) ?? currentOrder.value.payStatusText,
      })
      await Promise.all([loadRechargeOrders(), loadRecentRechargeOrders()])

      ElNotification.success({ message: t('personal.recharge.cancelOrderSuccess') })
    } finally {
      cancelingOrder.value = false
    }
  }

  const schedulePolling = () => {
    if (!currentOrder.value) {
      return
    }

    stopPolling()
    const orderNo = currentOrder.value.orderNo

    const run = async () => {
      if (!currentOrder.value || currentOrder.value.orderNo !== orderNo) {
        stopPolling()
        return
      }

      pollCount += 1
      await refreshOrderStatus(pollCount > 1)

      if (!currentOrder.value || currentOrder.value.orderNo !== orderNo) {
        stopPolling()
        return
      }

      if (
        currentOrder.value.payStatus === PayStatus.PAID ||
        currentOrder.value.payStatus === PayStatus.CLOSED ||
        currentOrder.value.payStatus === PayStatus.EXCEPTION ||
        pollCount >= MAX_POLL_COUNT
      ) {
        stopPolling()
        return
      }

      pollTimer = window.setTimeout(run, POLL_INTERVAL)
    }

    pollTimer = window.setTimeout(run, POLL_INTERVAL)
  }

  const openExternalPayment = (action: ExternalPaymentAction, targetWindow?: Window | null) => {
    const payWindow = targetWindow && !targetWindow.closed ? targetWindow : window.open('', '_blank')

    if (!payWindow) {
      popupBlocked.value = true
      ElNotification.warning({ message: t('personal.recharge.popupBlocked') })
      return false
    }

    popupBlocked.value = false

    if (action.type === 'html') {
      payWindow.document.open()
      payWindow.document.write(action.content)
      payWindow.document.close()
    } else {
      payWindow.location.href = action.content
    }

    payWindow.focus()
    return true
  }

  const buildPaymentView = async (payData: Record<string, unknown>) => {
    const mode = String(payData.mode ?? '')
    const content = String(payData.content ?? '')
    const meta = typeof payData.meta === 'object' && payData.meta !== null
      ? (payData.meta as Record<string, unknown>)
      : {}

    if (mode === 'qrcode' && content !== '') {
      return {
        mode: 'qrcode',
        content,
        qrDataUrl: await QRCode.toDataURL(content, { width: 240, margin: 1 }),
        raw: meta.raw && typeof meta.raw === 'object' ? (meta.raw as Record<string, unknown>) : payData,
      } satisfies RechargePaymentView
    }

    if (mode === 'external' && content !== '') {
      const externalType = String(meta.external_type ?? (looksLikeHtml(content) ? 'html' : 'link'))
      return {
        mode: 'external',
        content,
        externalType: externalType === 'html' ? 'html' : 'link',
        raw: meta.raw && typeof meta.raw === 'object' ? (meta.raw as Record<string, unknown>) : payData,
      } satisfies RechargePaymentView
    }

    return {
      mode: 'text',
      content: content || JSON.stringify(payData, null, 2),
      raw: meta.raw && typeof meta.raw === 'object' ? (meta.raw as Record<string, unknown>) : payData,
    } satisfies RechargePaymentView
  }

  const handlePayPresentation = async (
    payData: Record<string, unknown>,
    targetWindow?: Window | null,
    returnUrl = '',
  ) => {
    const normalizedPayData = withPaymentReturnUrl(payData, returnUrl)
    const view = await buildPaymentView(normalizedPayData)
    paymentView.value = view
    externalPayment.value = view.mode === 'external' ? { type: view.externalType!, content: view.content } : null

    if (view.mode === 'external' && externalPayment.value) {
      const opened = openExternalPayment(externalPayment.value, targetWindow)
      if (opened) {
        ElNotification.success({ message: t('personal.recharge.paymentWindowOpened') })
      }
      return
    }

    if (targetWindow && !targetWindow.closed) {
      targetWindow.close()
    }

    paymentDialogVisible.value = true
  }

  const updateCurrentOrderForPaying = (payMethod: string, transactionNo?: string | null) => {
    if (!currentOrder.value) {
      return
    }

    currentOrder.value = {
      ...currentOrder.value,
      payMethod,
      payMethodText: payMethodLabelMap.value.get(payMethod) ?? payMethod,
      payStatus: PayStatus.PAYING,
      payStatusText: payStatusLabelMap.value.get(String(PayStatus.PAYING)) ?? currentOrder.value.payStatusText,
      transactionNo: transactionNo ?? currentOrder.value.transactionNo ?? null,
    }
    updateRechargeOrderRow(currentOrder.value.orderNo, {
      pay_method: payMethod,
      pay_status: PayStatus.PAYING,
      pay_status_text: payStatusLabelMap.value.get(String(PayStatus.PAYING)) ?? currentOrder.value.payStatusText,
    })
  }

  const requestPayment = async (orderNo: string, payMethod: string, targetWindow?: Window | null) => {
    const returnUrl = resolvePaymentReturnUrl()
    const createPayRes = await OrderApi.createPay({
      order_no: orderNo,
      pay_method: payMethod,
      return_url: returnUrl,
    })

    const resolvedPayMethod = String(createPayRes.pay_method ?? payMethod ?? '')
    updateCurrentOrderForPaying(resolvedPayMethod, createPayRes.transaction_no ?? null)
    await handlePayPresentation((createPayRes.pay_data ?? {}) as Record<string, unknown>, targetWindow, returnUrl)
    void refreshOrderStatus(true)
    schedulePolling()
  }

  const submitRecharge = async () => {
    if (!userId.value) {
      return
    }

    const amount = rechargeAmount.value ?? 0
    if (amount <= 0) {
      ElNotification.warning({ message: t('personal.recharge.amountRequired') })
      return
    }

    if (selectedChannelId.value === null) {
      ElNotification.warning({ message: t('personal.recharge.channelRequired') })
      return
    }

    if (selectedPayMethod.value === '') {
      ElNotification.warning({ message: t('personal.recharge.payMethodRequired') })
      return
    }

    const canCreateRecharge = await ensureRechargeCreationAllowed()
    if (!canCreateRecharge) {
      return
    }

    const preopenedWindow =
      typeof window !== 'undefined' && isWindowPayMethod(selectedPayMethod.value) ? window.open('', '_blank') : null

    popupBlocked.value = Boolean(isWindowPayMethod(selectedPayMethod.value) && !preopenedWindow)
    submitting.value = true
    resetPaymentPresentation()

    try {
      const rechargeRes = await OrderApi.recharge({
        amount: Math.round(amount * 100),
        pay_method: selectedPayMethod.value,
        channel_id: selectedChannelId.value,
      })

      currentOrder.value = {
        orderNo: rechargeRes.order_no,
        payAmount: Number(rechargeRes.pay_amount ?? Math.round(amount * 100)),
        channelId: Number(selectedChannelId.value),
        channelText: channelLabelMap.value.get(String(selectedChannelId.value)) ?? '',
        payMethod: selectedPayMethod.value,
        payMethodText: payMethodLabelMap.value.get(selectedPayMethod.value) ?? selectedPayMethod.value,
        payStatus: PayStatus.PENDING,
        payStatusText: payStatusLabelMap.value.get(String(PayStatus.PENDING)) ?? '',
        bizStatus: BizStatus.INIT,
        bizStatusText: bizStatusLabelMap.value.get(String(BizStatus.INIT)) ?? '',
        expireTime: rechargeRes.expire_time,
        payTime: null,
        transactionNo: null,
        transactionStatus: null,
      }
      orderPage.value = {
        ...orderPage.value,
        current_page: DEFAULT_PAGE.current_page,
      }
      await Promise.all([loadRechargeOrders(), loadRecentRechargeOrders()])

      await requestPayment(rechargeRes.order_no, selectedPayMethod.value, preopenedWindow)
    } catch {
      void Promise.all([loadRechargeOrders(), loadRecentRechargeOrders()])
      if (preopenedWindow && !preopenedWindow.closed) {
        preopenedWindow.close()
      }
    } finally {
      submitting.value = false
    }
  }

  const resumePayment = async () => {
    if (!currentOrder.value) {
      return
    }

    if (paymentView.value?.mode === 'qrcode' || paymentView.value?.mode === 'text') {
      paymentDialogVisible.value = true
      return
    }

    if (externalPayment.value) {
      openExternalPayment(externalPayment.value)
      return
    }

    const preopenedWindow =
      typeof window !== 'undefined' && isWindowPayMethod(currentOrder.value.payMethod) ? window.open('', '_blank') : null

    popupBlocked.value = Boolean(isWindowPayMethod(currentOrder.value.payMethod) && !preopenedWindow)
    resetPaymentPresentation()

    try {
      await requestPayment(currentOrder.value.orderNo, currentOrder.value.payMethod, preopenedWindow)
    } catch {
      if (preopenedWindow && !preopenedWindow.closed) {
        preopenedWindow.close()
      }
    }
  }

  const copyPaymentContent = async () => {
    const content = paymentView.value?.content
    if (!content || typeof navigator === 'undefined' || !navigator.clipboard) {
      return
    }

    await navigator.clipboard.writeText(content)
    ElNotification.success({ message: t('personal.recharge.copySuccess') })
  }

  const handlePageChange = (page: number) => {
    transactionPage.value = {
      ...transactionPage.value,
      current_page: page,
    }
    void loadTransactions()
  }

  watch(
    selectedChannelId,
    () => {
      syncSelections()
    },
    { immediate: true },
  )

  watch(
    userId,
    (value) => {
      stopPolling()
      currentOrder.value = null
      resetPaymentPresentation()
      popupBlocked.value = false

      if (!value) {
        wallet.value = null
        transactions.value = []
        rechargeOrders.value = []
        recentRechargeOrders.value = []
        transactionPage.value = { ...DEFAULT_PAGE }
        orderPage.value = { ...DEFAULT_PAGE }
        return
      }

      transactionPage.value = { ...DEFAULT_PAGE }
      orderPage.value = { ...DEFAULT_PAGE }
      void (async () => {
        await loadInit()
        if (userId.value !== value) {
          return
        }

        await Promise.all([loadWallet(), loadTransactions(), loadRechargeOrders(), loadRecentRechargeOrders()])
      })()
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    stopPolling()
  })

  return {
    availableChannelOptions,
    availablePayMethodOptions,
    canCancelOrder,
    canRecharge,
    canResumePayment,
    cancelOrder,
    cancelingOrder,
    copyPaymentContent,
    currentOrder,
    handlePageChange,
    historyLoading,
    initLoading,
    loadTransactions,
    loadRechargeOrders,
    paymentDialogVisible,
    paymentView,
    popupBlocked,
    presetAmounts,
    rechargeAmount,
    refreshOrderStatus,
    resumePayment,
    selectedChannelId,
    selectedPayMethod,
    statusChecking,
    submitRecharge,
    submitting,
    summaryLoading,
    transactionPage,
    transactions,
    rechargeOrders,
    orderPage,
    orderLoading,
    recentRechargeOrders,
    recentOrdersLoading,
    handleOrderPageChange,
    selectRechargeOrder,
    wallet,
  }
}
