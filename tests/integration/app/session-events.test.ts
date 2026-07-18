import { describe, expect, it, vi } from 'vitest'
import { AppKernel } from '@/app/kernel'
import type { AuthEvent } from '@/modules/auth/types'

describe('AppKernel session events', () => {
  it('removes protected state when AuthSession expires', async () => {
    let listener: ((event: AuthEvent) => void) | undefined
    const logout = vi.fn(async () => undefined)
    const kernel = new AppKernel({
      environment: () => ({
        mode: 'test', platform: 'admin', clientVariant: 'browser',
        apiOrigin: new URL('http://localhost:5173'),
        realtimeOrigin: new URL('ws://localhost:5173/api/admin/v1/realtime/ws'),
      }),
      auth: {
        restore: vi.fn(async () => ({ kind: 'authenticated' as const })),
        login: vi.fn(),
        logout,
        dispose: vi.fn(async () => undefined),
        subscribe(next) {
          listener = next
          return () => { listener = undefined }
        },
      },
      principal: {
        load: vi.fn(async () => ({
          userId: 7, username: 'admin', avatar: '', roleName: 'administrator',
          menus: [], routes: [], buttonCodes: new Set(),
        })),
        clear: vi.fn(async () => undefined),
      },
      routes: { install: vi.fn(async () => undefined), clear: vi.fn(async () => undefined) },
      realtime: {
        connect: vi.fn(async () => undefined),
        disconnect: vi.fn(async () => undefined),
        dispose: vi.fn(async () => undefined),
        subscribe: vi.fn(() => () => undefined),
        retainTopic: vi.fn(() => () => undefined),
        registerRecovery: vi.fn(() => () => undefined),
      },
      persistence: {} as never,
      adapters: [],
    })
    await kernel.bootstrap()

    listener?.({ type: 'expired', reason: 'revoked' })

    await vi.waitFor(() => expect(logout).toHaveBeenCalledTimes(1))
    expect(kernel.state.value).toEqual({ kind: 'anonymous' })
  })
})
