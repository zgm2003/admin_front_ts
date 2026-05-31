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
  pageInit: vi.fn(),
  list: vi.fn(),
  resolve: vi.fn(),
  sync: vi.fn(),
  success: vi.fn(),
  tableData: { value: [] as PaymentRechargeListItem[] },
  warning: vi.fn(),
}))

vi.mock('@/api/payment/recharges', () => ({
  PaymentRechargeApi: {
    create: vi.fn(),
    close: vi.fn(),
    pageInit: mocks.pageInit,
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

describe('payment recharge sync retirement', () => {
  it('keeps manual and auto sync out of the current recharge page', () => {
    const page = usePaymentRechargePage()

    expect(page).not.toHaveProperty('autoSyncVisiblePayingRecharges')
    expect(page).not.toHaveProperty('syncReturnRecharge')
  })
})
