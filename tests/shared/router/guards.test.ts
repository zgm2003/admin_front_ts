import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { registerRouterGuards } from '@/router/guards'
import { createRuntimeBeforeEachGuard } from '@/modules/routing/guards'
import { useMenuStore } from '@/store/menu'

describe('Router guard integration boundary', () => {
  it('registers the kernel-owned before guard', async () => {
    let beforeGuard: ((to: { name: string; fullPath: string }) => Promise<unknown>) | undefined
    const router = {
      beforeEach: vi.fn((guard) => { beforeGuard = guard }),
      afterEach: vi.fn(),
    }
    registerRouterGuards(router, {
      state: { value: { kind: 'anonymous' } },
      bootstrap: vi.fn(async () => ({ kind: 'anonymous' })),
    })

    await expect(beforeGuard?.({ name: 'settings', fullPath: '/system/setting' })).resolves.toEqual({
      name: 'login',
      query: { redirect: '/system/setting' },
    })
  })

  it('returns one disposer that removes both router hooks', () => {
    const removeBefore = vi.fn()
    const removeAfter = vi.fn()
    const router = {
      beforeEach: vi.fn(() => removeBefore),
      afterEach: vi.fn(() => removeAfter),
    }
    const unregister = registerRouterGuards(router, {
      state: { value: { kind: 'anonymous' } },
      bootstrap: vi.fn(async () => ({ kind: 'anonymous' })),
    })

    unregister()

    expect(removeBefore).toHaveBeenCalledTimes(1)
    expect(removeAfter).toHaveBeenCalledTimes(1)
  })

  it('does not replace a valid selected menu with an empty id on a public route', () => {
    const pinia = createPinia()
    const menuStore = useMenuStore(pinia)
    menuStore.selectedMenu = '41'
    let afterGuard: ((to: { meta: Record<string, unknown>; fullPath: string }) => void) | undefined
    const setLastRoute = vi.fn()
    const router = {
      beforeEach: vi.fn(() => vi.fn()),
      afterEach: vi.fn((guard) => {
        afterGuard = guard
        return vi.fn()
      }),
    }

    registerRouterGuards(router, {
      state: { value: { kind: 'ready', principal: {} } } as never,
      bootstrap: vi.fn(),
    }, {
      pinia,
      menuPersistence: { setLastRoute } as never,
    })

    afterGuard?.({ meta: {}, fullPath: '/login' })

    expect(menuStore.selectedMenu).toBe('41')
    expect(setLastRoute).not.toHaveBeenCalled()
  })

  it('allows the kernel route replacement that completes route installation', async () => {
    const bootstrap = vi.fn(async () => ({ kind: 'anonymous' } as const))
    const guard = createRuntimeBeforeEachGuard({
      state: { value: { kind: 'installing-routes' } },
      bootstrap,
    })

    await expect(guard({ name: 'home', fullPath: '/home' })).resolves.toBe(true)
    expect(bootstrap).not.toHaveBeenCalled()
  })

  it('contains no cookie or storage authentication decision', () => {
    const source = readFileSync(resolve('src/router/guards.ts'), 'utf8')

    expect(source).not.toContain('js-cookie')
    expect(source).not.toContain('Cookies.')
    expect(source).not.toContain('localStorage')
    expect(source).not.toContain('sessionStorage')
  })
})
