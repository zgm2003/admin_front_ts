import { describe, expect, it, vi } from 'vitest'

vi.mock('@/api/pay/order', () => ({
  OrderApi: {},
}))

vi.mock('@/api/user/users', () => ({
  UsersListApi: {},
}))

vi.mock('@/components/Table', () => ({
  useTable: () => ({}),
}))

vi.mock('element-plus', () => ({
  ElNotification: {
    success: vi.fn(),
  },
}))

const {
  formatOrderUserLabel,
  formatOrderUserDisplay,
  getPayStatusTagType,
  getBizStatusTagType,
} = await import('../../../src/views/Main/pay/order/composables/usePayOrderPage')

describe('usePayOrderPage helpers', () => {
  it('formats order search user labels consistently', () => {
    expect(formatOrderUserLabel({
      username: 'alice',
      email: 'alice@example.com',
    })).toBe('alice (alice@example.com)')
  })

  it('formats order user display with graceful fallbacks', () => {
    expect(formatOrderUserDisplay({
      user_name: 'alice',
      user_email: 'alice@example.com',
    })).toBe('alice (alice@example.com)')

    expect(formatOrderUserDisplay({
      user_name: 'alice',
    })).toBe('alice')

    expect(formatOrderUserDisplay({
      user_id: 12,
    })).toBe('#12')

    expect(formatOrderUserDisplay({})).toBe('--')
  })

  it('maps order status values to stable tag types', () => {
    expect(getPayStatusTagType(3)).toBe('success')
    expect(getPayStatusTagType(4)).toBe('info')
    expect(getPayStatusTagType(5)).toBe('danger')
    expect(getPayStatusTagType(999)).toBe('warning')

    expect(getBizStatusTagType(4)).toBe('success')
    expect(getBizStatusTagType(5)).toBe('danger')
    expect(getBizStatusTagType(6)).toBe('warning')
    expect(getBizStatusTagType(3)).toBe('primary')
    expect(getBizStatusTagType(999)).toBe('info')
  })
})
