import { describe, expect, it, vi } from 'vitest'

vi.mock('@/api/pay/channel', () => ({
  PayChannelApi: {},
}))

vi.mock('@/hooks/useTable', () => ({
  useTable: () => ({}),
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
})
