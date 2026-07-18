import { describe, expect, it, vi } from 'vitest'
import { AppKernel } from '@/app/kernel'
import { AuthSession } from '@/modules/auth/session'
import type { CredentialAdapter } from '@/modules/auth/types'

describe('AppKernel logout integration', () => {
  it('freezes the session and completes protected cleanup before becoming anonymous', async () => {
    const order: string[] = []
    const adapter: CredentialAdapter = {
      variant: 'browser',
      restore: vi.fn(async () => ({ accessToken: 'access', expiresAt: Date.now() + 60_000 })),
      login: vi.fn(async () => ({ accessToken: 'access', expiresAt: Date.now() + 60_000 })),
      refresh: vi.fn(async () => ({ accessToken: 'access', expiresAt: Date.now() + 60_000 })),
      revoke: vi.fn(async () => { order.push('revoke') }),
      clear: vi.fn(async () => { order.push('credential-clear') }),
    }
    const auth = new AuthSession({
      adapter,
      logoutHooks: {
        disconnectRealtime: async () => { order.push('realtime') },
        abortAuthenticatedRequests: async () => { order.push('requests') },
        removeRoutes: async () => { order.push('routes') },
        clearPrincipal: async () => { order.push('principal') },
        clearIdentityPersistence: async () => { order.push('identity-persistence') },
        navigateToLogin: async () => { order.push('navigate') },
      },
    })
    const kernel = new AppKernel({
      environment: () => ({
        mode: 'test',
        platform: 'admin',
        apiOrigin: new URL('http://localhost:5173'),
        realtimeOrigin: new URL('ws://localhost:5173/api/admin/v1/realtime/ws'),
        clientVariant: 'browser',
      }),
      auth,
      principal: {
        load: vi.fn(async () => ({
          userId: 7,
          username: 'admin',
          avatar: '',
          roleName: 'administrator',
          menus: [],
          routes: [],
          buttonCodes: new Set(),
        })),
        clear: vi.fn(async () => undefined),
      },
      routes: {
        install: vi.fn(async () => undefined),
        clear: vi.fn(async () => undefined),
      },
      realtime: { disconnect: vi.fn(async () => undefined) },
      persistence: {} as never,
      adapters: [],
    })
    await kernel.bootstrap()

    await kernel.logout()

    expect(order).toEqual([
      'revoke',
      'realtime',
      'requests',
      'routes',
      'principal',
      'identity-persistence',
      'credential-clear',
      'navigate',
    ])
    expect(kernel.state.value).toEqual({ kind: 'anonymous' })
  })

  it('revokes a newly authenticated session when principal loading fails', async () => {
    const logout = vi.fn(async () => undefined)
    const kernel = new AppKernel({
      environment: () => ({
        mode: 'test',
        platform: 'admin',
        apiOrigin: new URL('http://localhost:5173'),
        realtimeOrigin: new URL('ws://localhost:5173/api/admin/v1/realtime/ws'),
        clientVariant: 'browser',
      }),
      auth: {
        restore: vi.fn(async () => ({ kind: 'anonymous' as const })),
        login: vi.fn(async () => undefined),
        logout,
        dispose: vi.fn(async () => undefined),
      },
      principal: {
        load: vi.fn(async () => { throw new Error('principal unavailable') }),
        clear: vi.fn(async () => undefined),
      },
      routes: {
        install: vi.fn(async () => undefined),
        clear: vi.fn(async () => undefined),
      },
      realtime: { disconnect: vi.fn(async () => undefined) },
      persistence: {} as never,
      adapters: [],
    })

    await expect(kernel.login({
      login_type: 'email',
      login_account: 'admin@example.test',
      code: '123456',
    })).rejects.toThrow('principal unavailable')

    expect(logout).toHaveBeenCalledTimes(1)
    expect(kernel.state.value).toEqual({ kind: 'anonymous' })
  })
})
