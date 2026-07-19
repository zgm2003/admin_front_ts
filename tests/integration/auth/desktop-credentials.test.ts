import { describe, expect, it, vi } from 'vitest'
import { DesktopCredentialAdapter, type NativeBridge } from '@/adapters/native'
import { mapNativeCredentialError } from '@/adapters/tauri/native-bridge'
import { AuthSession } from '@/modules/auth/session'
import { AuthSessionError } from '@/modules/auth/types'

describe('desktop credential handoff', () => {
  it('seals the rotating refresh credential and returns only the access credential', async () => {
    const seal = vi.fn(async () => undefined)
    const bridge = {
      kind: 'tauri',
      credentials: {
        seal,
        refresh: vi.fn(),
        clear: vi.fn(async () => undefined),
      },
    } as unknown as NativeBridge
    const fetch = vi.fn(async () => new Response(JSON.stringify({
      code: 0,
      data: {
        access_token: 'desktop-access',
        expires_in: 60,
        refresh_token: 'desktop-refresh',
        refresh_expires_in: 3_600,
      },
      msg: 'success',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const adapter = new DesktopCredentialAdapter({
      apiOrigin: new URL('https://admin.example.test'),
      bridge,
      fetch,
      now: () => 1_000,
      headers: () => ({ platform: 'admin', 'device-id': 'device-1' }),
    })

    await expect(adapter.login({
      login_type: 'email',
      login_account: 'admin@example.test',
      code: '123456',
    }, new AbortController().signal)).resolves.toEqual({
      accessToken: 'desktop-access',
      expiresAt: 61_000,
    })
    expect(seal).toHaveBeenCalledWith({ refreshToken: 'desktop-refresh' })
    expect(fetch).toHaveBeenCalledWith(
      'https://admin.example.test/api/admin/v1/auth/login',
      expect.objectContaining({
        credentials: 'omit',
        headers: expect.objectContaining({ 'X-Admin-Client-Variant': 'desktop' }),
      }),
    )
  })

  it('rejects malformed desktop envelopes without sealing any value', async () => {
    const seal = vi.fn(async () => undefined)
    const bridge = {
      kind: 'tauri',
      credentials: { seal, refresh: vi.fn(), clear: vi.fn() },
    } as unknown as NativeBridge
    const adapter = new DesktopCredentialAdapter({
      apiOrigin: new URL('https://www.zgm2003.cn'),
      bridge,
      fetch: vi.fn(async () => new Response(JSON.stringify({
        code: 0,
        data: { access_token: 'access', expires_in: 60 },
        msg: 'success',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })),
    })

    await expect(adapter.login({
      login_type: 'password',
      login_account: '13800138000',
      password: 'secret',
    }, new AbortController().signal)).rejects.toMatchObject({
      code: 'auth.desktop_credential_contract_invalid',
    })
    expect(seal).not.toHaveBeenCalled()
  })

  it('maps a missing sealed credential to an anonymous restore result', async () => {
    const bridge = {
      kind: 'tauri',
      credentials: {
        seal: vi.fn(),
        refresh: vi.fn(async () => {
          throw new AuthSessionError('auth.credential_missing', 'missing', { status: 401 })
        }),
        clear: vi.fn(),
      },
    } as unknown as NativeBridge
    const adapter = new DesktopCredentialAdapter({
      apiOrigin: new URL('https://www.zgm2003.cn'),
      bridge,
      fetch: vi.fn(),
      headers: () => ({ platform: 'admin', 'device-id': 'device-1' }),
    })

    await expect(adapter.restore(new AbortController().signal)).resolves.toBeNull()
  })

  it('passes the documented device identity into the native refresh boundary', async () => {
    const refresh = vi.fn(async () => ({ accessToken: 'access', expiresAt: 61_000 }))
    const bridge = {
      kind: 'tauri',
      credentials: { seal: vi.fn(), refresh, clear: vi.fn() },
    } as unknown as NativeBridge
    const adapter = new DesktopCredentialAdapter({
      apiOrigin: new URL('https://www.zgm2003.cn'),
      bridge,
      headers: () => ({ platform: 'admin', 'device-id': 'device-1' }),
    })

    await expect(adapter.refresh(new AbortController().signal)).resolves.toEqual({
      accessToken: 'access',
      expiresAt: 61_000,
    })
    expect(refresh).toHaveBeenCalledWith('device-1')
  })

  it('maps only the sealed native error contract and never reflects unknown values', () => {
    expect(mapNativeCredentialError({
      kind: 'credential_missing',
      message: '登录凭证不存在，请重新登录',
    })).toMatchObject({ code: 'auth.credential_missing', status: 401 })
    expect(mapNativeCredentialError({
      kind: 'authentication',
      message: '登录凭证已失效，请重新登录',
    })).toMatchObject({ code: 'auth.revoked', status: 401 })

    const secret = 'refresh-token-must-not-leak'
    const malformed = mapNativeCredentialError({ kind: 'unknown', message: secret })
    expect(malformed).toMatchObject({ code: 'auth.native_command_contract_invalid' })
    expect(malformed.message).not.toContain(secret)
  })

  it('clears the OS credential even when desktop server revoke fails', async () => {
    const clear = vi.fn(async () => undefined)
    const bridge = {
      kind: 'tauri',
      credentials: {
        seal: vi.fn(),
        refresh: vi.fn(async () => ({ accessToken: 'access', expiresAt: Date.now() + 60_000 })),
        clear,
      },
    } as unknown as NativeBridge
    const adapter = new DesktopCredentialAdapter({
      apiOrigin: new URL('https://www.zgm2003.cn'),
      bridge,
      headers: () => ({ platform: 'admin', 'device-id': 'device-1' }),
      fetch: vi.fn(async () => {
        throw new TypeError('network unavailable')
      }),
    })
    const session = new AuthSession({ adapter })
    await session.restore()

    await expect(session.logout()).resolves.toBeUndefined()
    expect(clear).toHaveBeenCalledOnce()
  })
})
