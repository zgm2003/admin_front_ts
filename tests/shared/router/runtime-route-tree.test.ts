import { describe, expect, it, vi } from 'vitest'
import { buildRuntimeRouteTree } from '../../../src/router/runtime-route-tree'

describe('runtime route tree', () => {
  it('keeps the original path and swaps in DeadPage when view_key is missing', () => {
    const modules = {
      '../views/Main/payment/channel/index.vue': vi.fn(),
    }

    const tree = buildRuntimeRouteTree([
      {
        path: '/payment/order',
        name: 'payment-order',
        view_key: 'payment/order',
        meta: { menuId: '88' },
      },
    ], modules)

    const deadRoute = tree.find((route) => route.path === '/payment/order')

    expect(deadRoute?.name).toBe('payment-order')
    expect(deadRoute?.meta?.errorKind).toBe('dead')
    expect(deadRoute?.meta?.deadRoutePath).toBe('/payment/order')
    expect(deadRoute?.meta?.deadViewKey).toBe('payment/order')
  })
})
