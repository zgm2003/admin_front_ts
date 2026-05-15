import { describe, expect, it, vi } from 'vitest'
import { buildRuntimeRouteTree } from '../../../src/router/runtime-route-tree'

describe('runtime route tree', () => {
  it('keeps the original path and swaps in DeadPage when view_key is missing', () => {
    const modules = {
      '../views/Main/payment/config/index.vue': vi.fn(),
    }

    const tree = buildRuntimeRouteTree([
      {
        path: '/system/missing',
        name: 'system-missing',
        view_key: 'system/missing',
        meta: { menuId: '88' },
      },
    ], modules)

    const deadRoute = tree.find((route) => route.path === '/system/missing')

    expect(deadRoute?.name).toBe('system-missing')
    expect(deadRoute?.meta?.errorKind).toBe('dead')
    expect(deadRoute?.meta?.deadRoutePath).toBe('/system/missing')
    expect(deadRoute?.meta?.deadViewKey).toBe('system/missing')
  })
})
