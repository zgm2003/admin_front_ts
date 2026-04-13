import { describe, expect, it, vi } from 'vitest'

const { buildViewModuleKey, resolveViewComponent } = await import('../../../src/router/view-registry')

describe('view-registry', () => {
  it('normalizes backend component paths into Main view module keys', () => {
    expect(buildViewModuleKey('pay/channel')).toBe('../views/Main/pay/channel/index.vue')
    expect(buildViewModuleKey('/pay/channel')).toBe('../views/Main/pay/channel/index.vue')
    expect(buildViewModuleKey('///pay/channel')).toBe('../views/Main/pay/channel/index.vue')
  })

  it('returns undefined when the resolved component does not exist', () => {
    const modules = {
      '../views/Main/pay/order/index.vue': vi.fn(),
    }

    expect(resolveViewComponent(modules, 'pay/channel')).toBeUndefined()
  })

  it('resolves component loaders only by exact normalized view key', () => {
    const loader = vi.fn()
    const modules = {
      '../views/Main/pay/channel/index.vue': loader,
    }

    expect(resolveViewComponent(modules, 'pay/channel')).toBe(loader)
  })

  it('does not fall back to suffix matching when the module key is not exact', () => {
    const loader = vi.fn()
    const modules = {
      'unexpected/prefix/../views/Main/pay/channel/index.vue': loader,
    }

    expect(resolveViewComponent(modules, 'pay/channel')).toBeUndefined()
  })
})
