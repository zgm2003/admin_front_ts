import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { registerRouterGuards } from '@/router/guards'

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

  it('contains no cookie or storage authentication decision', () => {
    const source = readFileSync(resolve('src/router/guards.ts'), 'utf8')

    expect(source).not.toContain('js-cookie')
    expect(source).not.toContain('Cookies.')
    expect(source).not.toContain('localStorage')
    expect(source).not.toContain('sessionStorage')
  })
})
