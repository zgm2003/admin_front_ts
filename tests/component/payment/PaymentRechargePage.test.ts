import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  PaymentRechargeInitResponse,
  PaymentRechargeListItem,
} from '@/api/payment/recharges'

const mocks = vi.hoisted(() => ({
  can: vi.fn(),
  create: vi.fn(),
  getList: vi.fn(),
  navigateToExternalHttps: vi.fn(),
  onPageChange: vi.fn(),
  pageInit: vi.fn(),
  pay: vi.fn(),
  list: vi.fn(),
  resolve: vi.fn(),
  routeQuery: {} as Record<string, string>,
  tableData: { value: [] as PaymentRechargeListItem[] },
}))

vi.mock('@/api/payment/recharges', () => ({
  PaymentRechargeApi: {
    create: mocks.create,
    pageInit: mocks.pageInit,
    list: mocks.list,
    pay: mocks.pay,
  },
}))
vi.mock('@/components/Table', () => ({
  useTable: () => ({
    clearSelection: vi.fn(),
    data: mocks.tableData,
    getList: mocks.getList,
    loading: { value: false },
    onPageChange: mocks.onPageChange,
    onSelectionChange: vi.fn(),
    page: { value: { current_page: 1, page_size: 10, total: 0 } },
    refresh: vi.fn(),
    resetPage: vi.fn(),
    selectedIds: { value: [] },
  }),
}))
vi.mock('@/store/user', () => ({ useUserStore: () => ({ can: mocks.can }) }))
vi.mock('@/lib/browser/navigation', () => ({
  navigateToExternalHttps: mocks.navigateToExternalHttps,
}))
vi.mock('element-plus', () => ({ ElNotification: { success: vi.fn() } }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: mocks.routeQuery }),
  useRouter: () => ({ resolve: mocks.resolve }),
}))

const { usePaymentRechargePage } = await import(
  '@/views/Main/payment/recharge/composables/usePaymentRechargePage'
)

const initResponse = (): PaymentRechargeInitResponse => ({
  wallet: {
    available_balance: '0',
    balance: '0',
    held_amount: '0',
    total_consume: '0',
    total_recharge: '0',
  },
  packages: [],
  payment_method: { provider: 'alipay', label: 'Alipay', enabled: false },
  dict: { status_arr: [] },
})

const recharge = (overrides: Partial<PaymentRechargeListItem> = {}): PaymentRechargeListItem => ({
  id: 9,
  recharge_no: 'RECHARGE-9',
  payment_order_no: 'PAY-9',
  package_code: 'starter',
  package_name: 'Starter',
  amount_cents: 1000,
  amount_text: '10',
  status: 'pending',
  status_text: 'Pending',
  pay_url: '',
  paid_at: '',
  credited_at: '',
  created_at: '2026-07-27 10:00:00',
  updated_at: '2026-07-27 10:00:00',
  ...overrides,
})

function mountPage() {
  let page!: ReturnType<typeof usePaymentRechargePage>
  const Harness = defineComponent({
    setup() {
      page = usePaymentRechargePage()
      return () => null
    },
  })
  mount(Harness)
  return () => page
}

describe('payment recharge page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mocks.routeQuery).forEach((key) => delete mocks.routeQuery[key])
    mocks.getList.mockResolvedValue(undefined)
    mocks.pageInit.mockResolvedValue(initResponse())
    mocks.resolve.mockReturnValue({ href: '/payment/recharge' })
  })

  it('initializes the cashier without recent state or a records request', async () => {
    const page = mountPage()
    await flushPromises()

    expect(page()).not.toHaveProperty('autoSyncVisiblePayingRecharges')
    expect(page()).not.toHaveProperty('syncReturnRecharge')
    expect(page()).not.toHaveProperty('recent')
    expect(mocks.pageInit).toHaveBeenCalledTimes(1)
    expect(mocks.getList).not.toHaveBeenCalled()
  })

  it('loads the independent records list when the records tab is opened', async () => {
    const page = mountPage()
    await flushPromises()

    page().activeTab.value = 'records'
    await flushPromises()

    expect(mocks.getList).toHaveBeenCalledTimes(1)
    page().onPageChange({ current_page: 2, page_size: 20, total: 21 })
    expect(mocks.onPageChange).toHaveBeenCalledWith({ current_page: 2, page_size: 20, total: 21 })
  })

  it('returns directly to records and loads them from a payment return query', async () => {
    mocks.routeQuery.tab = 'records'
    mocks.routeQuery.recharge_no = 'RECHARGE-9'

    const page = mountPage()
    await flushPromises()

    expect(page().activeTab.value).toBe('records')
    expect(mocks.pageInit).toHaveBeenCalledTimes(1)
    expect(mocks.getList).toHaveBeenCalledTimes(1)
  })

  it('continues an existing payment URL or requests a new one from the pay API', async () => {
    const page = mountPage()
    await flushPromises()

    await page().payRecharge(recharge({ status: 'paying', pay_url: 'https://www.zgm2003.cn/pay/existing' }))
    expect(mocks.pay).not.toHaveBeenCalled()
    expect(mocks.navigateToExternalHttps).toHaveBeenLastCalledWith('https://www.zgm2003.cn/pay/existing')

    mocks.pay.mockResolvedValue({
      id: 9,
      payment_order_no: 'PAY-9',
      pay_url: 'https://www.zgm2003.cn/pay/new',
      recharge_no: 'RECHARGE-9',
      status: 'paying',
    })
    await page().payRecharge(recharge({ status: 'failed' }))
    expect(mocks.pay).toHaveBeenCalledWith(9)
    expect(mocks.navigateToExternalHttps).toHaveBeenLastCalledWith('https://www.zgm2003.cn/pay/new')
  })
})
