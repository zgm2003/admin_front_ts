import { describe, expect, it, beforeEach, vi } from 'vitest'
import type {
  PaymentRechargeInitResponse,
  PaymentRechargeListItem,
  PaymentRechargeStatus,
  PaymentRechargeStatusResponse,
} from '@/api/payment/recharges'

const mocks = vi.hoisted(() => ({
  can: vi.fn(),
  getList: vi.fn(),
  init: vi.fn(),
  list: vi.fn(),
  resolve: vi.fn(),
  sync: vi.fn(),
  success: vi.fn(),
  tableData: { value: [] as PaymentRechargeListItem[] },
  warning: vi.fn(),
}))

vi.mock('@/api/payment/recharges', () => ({
  PaymentRechargeApi: {
    add: vi.fn(),
    close: vi.fn(),
    init: mocks.init,
    list: mocks.list,
    pay: vi.fn(),
    sync: mocks.sync,
  },
}))

vi.mock('@/components/Table', () => ({
  useTable: () => ({
    clearSelection: vi.fn(),
    data: mocks.tableData,
    getList: mocks.getList,
    loading: { value: false },
    onPageChange: vi.fn(),
    onSelectionChange: vi.fn(),
    page: { value: { current_page: 1, page_size: 10, total: 0 } },
    refresh: vi.fn(),
    resetPage: vi.fn(),
    selectedIds: { value: [] },
  }),
}))

vi.mock('@/store/user', () => ({
  useUserStore: () => ({
    can: mocks.can,
  }),
}))

vi.mock('element-plus', () => ({
  ElMessageBox: {
    confirm: vi.fn(),
  },
  ElNotification: {
    success: mocks.success,
    warning: mocks.warning,
  },
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {},
  }),
  useRouter: () => ({
    resolve: mocks.resolve,
  }),
}))

const { usePaymentRechargePage } = await import('@/views/Main/payment/recharge/composables/usePaymentRechargePage')

describe('payment recharge auto sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.can.mockReturnValue(true)
    mocks.getList.mockResolvedValue({ list: [], page: { current_page: 1, page_size: 10, total: 0 } })
    mocks.init.mockResolvedValue(initResponse())
    mocks.list.mockResolvedValue({ list: [], page: { current_page: 1, page_size: 10, total: 0 } })
    mocks.resolve.mockReturnValue({ href: '/payment/recharge' })
    mocks.tableData.value = []
  })

  it('retries a visible paying recharge after a transient auto-sync failure', async () => {
    mocks.tableData.value = [rechargeRow(42, 'paying')]
    mocks.sync
      .mockRejectedValueOnce(new Error('temporary sync failure'))
      .mockResolvedValueOnce(statusResponse(42))

    const page = usePaymentRechargePage()

    await page.autoSyncVisiblePayingRecharges()
    await page.autoSyncVisiblePayingRecharges()

    expect(mocks.sync).toHaveBeenCalledTimes(2)
    expect(mocks.sync).toHaveBeenNthCalledWith(1, 42)
    expect(mocks.sync).toHaveBeenNthCalledWith(2, 42)
    expect(mocks.warning).toHaveBeenCalledTimes(1)
  })

  it('retries visible auto-sync when previous successful sync is still paying', async () => {
    mocks.tableData.value = [rechargeRow(42, 'paying')]
    mocks.sync
      .mockResolvedValueOnce({ ...statusResponse(42), status: 'paying' })
      .mockResolvedValueOnce({ ...statusResponse(42), status: 'credited' })

    const page = usePaymentRechargePage()

    await page.autoSyncVisiblePayingRecharges()
    await page.autoSyncVisiblePayingRecharges()

    expect(mocks.sync).toHaveBeenCalledTimes(2)
    expect(mocks.sync).toHaveBeenNthCalledWith(1, 42)
    expect(mocks.sync).toHaveBeenNthCalledWith(2, 42)
  })

  it('retries return-url recharge sync after a transient lookup failure', async () => {
    mocks.list
      .mockRejectedValueOnce(new Error('temporary list failure'))
      .mockResolvedValueOnce({
        list: [rechargeRow(43, 'paying')],
        page: { current_page: 1, page_size: 1, total: 1 },
      })
    mocks.sync.mockResolvedValueOnce(statusResponse(43))

    const page = usePaymentRechargePage()

    await page.syncReturnRecharge('R43')
    await page.syncReturnRecharge('R43')

    expect(mocks.list).toHaveBeenCalledTimes(2)
    expect(mocks.sync).toHaveBeenCalledTimes(1)
    expect(mocks.sync).toHaveBeenCalledWith(43)
  })

  it('retries return-url sync when previous successful sync is still paying', async () => {
    mocks.list.mockResolvedValue({
      list: [rechargeRow(43, 'paying')],
      page: { current_page: 1, page_size: 1, total: 1 },
    })
    mocks.sync
      .mockResolvedValueOnce({ ...statusResponse(43), status: 'paying' })
      .mockResolvedValueOnce({ ...statusResponse(43), status: 'credited' })

    const page = usePaymentRechargePage()

    await page.syncReturnRecharge('R43')
    await page.syncReturnRecharge('R43')

    expect(mocks.sync).toHaveBeenCalledTimes(2)
    expect(mocks.sync).toHaveBeenNthCalledWith(1, 43)
    expect(mocks.sync).toHaveBeenNthCalledWith(2, 43)
  })
})

function rechargeRow(id: number, status: PaymentRechargeStatus): PaymentRechargeListItem {
  return {
    amount_cents: 1000,
    amount_text: '¥10.00',
    created_at: '2026-05-30 10:00:00',
    credited_at: '',
    id,
    package_code: 'p10',
    package_name: '10元',
    paid_at: '',
    pay_url: '',
    payment_order_no: `PO${id}`,
    recharge_no: `R${id}`,
    status,
    status_text: status,
    updated_at: '2026-05-30 10:00:00',
  }
}

function statusResponse(id: number): PaymentRechargeStatusResponse {
  return {
    credited_at: '',
    failure_reason: '',
    id,
    paid_at: '',
    recharge_no: `R${id}`,
    status: 'paying',
    status_text: '支付中',
    wallet: walletSummary(),
  }
}

function initResponse(): PaymentRechargeInitResponse {
  return {
    dict: { status_arr: [] },
    packages: [],
    payment_method: {
      enabled: true,
      label: 'Alipay',
      provider: 'alipay',
    },
    recent: [],
    wallet: walletSummary(),
  }
}

function walletSummary(): PaymentRechargeStatusResponse['wallet'] {
  return {
    balance_cents: 0,
    balance_text: '¥0.00',
    total_consume_cents: 0,
    total_consume_text: '¥0.00',
    total_recharge_cents: 0,
    total_recharge_text: '¥0.00',
  }
}
