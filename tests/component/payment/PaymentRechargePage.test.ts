import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PaymentRechargeListItem } from '@/api/payment/recharges'

const mocks = vi.hoisted(() => ({
  can: vi.fn(),
  getList: vi.fn(),
  pageInit: vi.fn(),
  list: vi.fn(),
  resolve: vi.fn(),
  tableData: { value: [] as PaymentRechargeListItem[] },
}))

vi.mock('@/api/payment/recharges', () => ({
  PaymentRechargeApi: {
    create: vi.fn(),
    close: vi.fn(),
    pageInit: mocks.pageInit,
    list: mocks.list,
    pay: vi.fn(),
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
vi.mock('@/store/user', () => ({ useUserStore: () => ({ can: mocks.can }) }))
vi.mock('element-plus', () => ({ ElNotification: { success: vi.fn() } }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ resolve: mocks.resolve }),
}))

const { usePaymentRechargePage } = await import(
  '@/views/Main/payment/recharge/composables/usePaymentRechargePage'
)

describe('payment recharge sync retirement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getList.mockResolvedValue(undefined)
    mocks.pageInit.mockResolvedValue({
      wallet: {
        balance_cents: 0,
        balance_text: '¥0.00',
        total_recharge_cents: 0,
        total_recharge_text: '¥0.00',
        total_consume_cents: 0,
        total_consume_text: '¥0.00',
      },
      packages: [],
      payment_method: { provider: 'alipay', label: 'Alipay', enabled: false },
      dict: { status_arr: [] },
      recent: [],
    })
  })

  it('keeps manual and automatic sync out of the mounted page workflow', async () => {
    let page!: ReturnType<typeof usePaymentRechargePage>
    const Harness = defineComponent({
      setup() {
        page = usePaymentRechargePage()
        return () => null
      },
    })

    mount(Harness)
    await flushPromises()

    expect(page).not.toHaveProperty('autoSyncVisiblePayingRecharges')
    expect(page).not.toHaveProperty('syncReturnRecharge')
    expect(mocks.pageInit).toHaveBeenCalledTimes(1)
  })
})
