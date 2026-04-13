import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

vi.mock('@/api/pay/channel', () => ({
  PayChannelApi: {},
}))

const crudTableState = {
  loading: ref(false),
  data: ref([]),
  page: ref({ current_page: 1, page_size: 20, total: 0 }),
  onSearch: vi.fn(),
  onPageChange: vi.fn(),
  refresh: vi.fn(),
  getList: vi.fn(),
  onSelectionChange: vi.fn(),
  confirmDel: vi.fn(),
  batchDel: vi.fn(),
  toggleStatus: vi.fn(),
}

vi.mock('@/hooks/useCrudTable', () => ({
  useCrudTable: () => crudTableState,
}))

vi.mock('element-plus', () => ({
  ElNotification: {
    success: vi.fn(),
  },
}))

const {
  buildPayChannelNotifyUrl,
  createDefaultPayChannelForm,
  filterPayChannelMethods,
  usePayChannelPage,
} = await import('../../../src/views/Main/pay/channel/composables/usePayChannelPage')

describe('usePayChannelPage helpers', () => {
  it('creates the default pay channel form with expected defaults', () => {
    expect(createDefaultPayChannelForm()).toMatchObject({
      id: 0,
      channel: 1,
      supported_methods: [],
      is_sandbox: 2,
      status: 1,
      notify_url: '',
    })
  })

  it('filters unsupported pay methods out of an existing selection', () => {
    expect(
      filterPayChannelMethods(['wxpay', 'alipay', 'invalid'], [
        { label: '微信', value: 'wxpay' },
        { label: '支付宝', value: 'alipay' },
      ]),
    ).toEqual(['wxpay', 'alipay'])
  })

  it('builds notify urls by channel id', () => {
    expect(buildPayChannelNotifyUrl(1)).toBe('https://www.zgm2003.cn/api/pay/notify/wechat')
    expect(buildPayChannelNotifyUrl(2)).toBe('https://www.zgm2003.cn/api/pay/notify/alipay')
    expect(buildPayChannelNotifyUrl(999)).toBe('')
  })

  it('reuses useCrudTable for standard list, search, pagination and row actions', () => {
    const page = usePayChannelPage({
      t: (key: string) => key,
    })

    expect(page.onSearch).toBe(crudTableState.onSearch)
    expect(page.onPageChange).toBe(crudTableState.onPageChange)
    expect(page.refresh).toBe(crudTableState.refresh)
    expect(page.getList).toBe(crudTableState.getList)
    expect(page.onSelectionChange).toBe(crudTableState.onSelectionChange)
    expect(page.confirmDel).toBe(crudTableState.confirmDel)
    expect(page.batchDel).toBe(crudTableState.batchDel)
    expect(page.toggleStatus).toBe(crudTableState.toggleStatus)
  })
})
