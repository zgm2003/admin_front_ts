import { describe, expect, it, vi } from 'vitest'
import { DesktopCredentialAdapter, type NativeBridge } from '@/adapters/native'

describe('desktop credential handoff', () => {
  it('seals the rotating refresh credential and returns only the access credential', async () => {
    const bridge: NativeBridge = {
      available: true,
      sealRefreshCredential: vi.fn(async () => undefined),
      refreshAccessCredential: vi.fn(),
      revokeAccessCredential: vi.fn(async () => undefined),
      clearRefreshCredential: vi.fn(async () => undefined),
    }
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
    expect(bridge.sealRefreshCredential).toHaveBeenCalledWith({
      refreshToken: 'desktop-refresh',
      expiresAt: 3_601_000,
    })
    expect(fetch).toHaveBeenCalledWith(
      'https://admin.example.test/api/admin/v1/auth/login',
      expect.objectContaining({
        credentials: 'omit',
        headers: expect.objectContaining({ 'X-Admin-Client-Variant': 'desktop' }),
      }),
    )
  })
})
