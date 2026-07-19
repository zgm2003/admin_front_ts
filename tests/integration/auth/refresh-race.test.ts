import { describe, expect, it, vi } from 'vitest'
import { CookieCredentialAdapter } from '@/adapters/browser/cookie-credentials'
import { BrowserRefreshCoordinator } from '@/adapters/web/browser-coordinator'

function success(data: Record<string, unknown>) {
  return new Response(JSON.stringify({ code: 0, data, msg: 'success' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('browser credential transport', () => {
  it('uses the formal cookie transport, exact common headers, and no refresh request body', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(success({ access_token: 'login-access', expires_in: 60 }))
      .mockResolvedValueOnce(success({ access_token: 'refresh-access', expires_in: 60 }))
    const adapter = new CookieCredentialAdapter({
      apiOrigin: new URL('https://admin.example.test'),
      fetch,
      now: () => 1_000,
      headers: () => ({
        platform: 'admin',
        'device-id': 'device-1',
        'Accept-Language': 'zh-CN',
        'X-Trace-Id': 'trace-1',
      }),
    })
    const signal = new AbortController().signal

    await adapter.login({
      login_type: 'email',
      login_account: 'admin@example.test',
      code: '123456',
    }, signal)
    await adapter.refresh(signal)

    expect(fetch).toHaveBeenNthCalledWith(1, 'https://admin.example.test/api/admin/v1/auth/login', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      headers: {
        platform: 'admin',
        'device-id': 'device-1',
        'Accept-Language': 'zh-CN',
        'X-Trace-Id': 'trace-1',
        'Content-Type': 'application/json',
      },
    }))
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      login_type: 'email',
      login_account: 'admin@example.test',
      code: '123456',
    })
    expect(fetch).toHaveBeenNthCalledWith(2, 'https://admin.example.test/api/admin/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        platform: 'admin',
        'device-id': 'device-1',
        'Accept-Language': 'zh-CN',
        'X-Trace-Id': 'trace-1',
      },
      signal,
    })
    expect(fetch.mock.calls[1]?.[1]).not.toHaveProperty('body')
    expect(JSON.stringify(fetch.mock.calls)).not.toContain('X-Admin-Client-Variant')
  })

  it('rejects every undocumented credential response field as a contract error', async () => {
    const adapter = new CookieCredentialAdapter({
      apiOrigin: new URL('https://admin.example.test'),
      fetch: vi.fn(async () => success({
        access_token: 'access',
        expires_in: 60,
        undocumented: 'must-not-be-accepted',
      })),
    })

    await expect(adapter.refresh(new AbortController().signal)).rejects.toMatchObject({
      code: 'auth.credential_contract_invalid',
    })
  })

  it('revokes with bearer authentication and clears only through the cookie response', async () => {
    const fetch = vi.fn(async () => success({}))
    const adapter = new CookieCredentialAdapter({
      apiOrigin: new URL('https://admin.example.test'),
      fetch,
    })
    const signal = new AbortController().signal

    await adapter.revoke('access-secret', signal)

    expect(fetch).toHaveBeenCalledWith('https://admin.example.test/api/admin/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: 'Bearer access-secret',
      },
      signal,
    })
  })

  it('rejects undocumented logout response fields as a contract error', async () => {
    const adapter = new CookieCredentialAdapter({
      apiOrigin: new URL('https://admin.example.test'),
      fetch: vi.fn(async () => success({ undocumented: true })),
    })

    await expect(adapter.revoke('access-secret', new AbortController().signal)).rejects.toMatchObject({
      code: 'auth.logout_contract_invalid',
    })
  })
})

describe('BrowserRefreshCoordinator', () => {
  it('falls back to the server rotation boundary when Web Locks are unavailable', async () => {
    const posted: unknown[] = []
    const coordinator = new BrowserRefreshCoordinator({
      lockManager: null,
      channel: {
        postMessage: (message) => posted.push(message),
        close: vi.fn(),
        setMessageHandler: vi.fn(),
      },
      now: () => 500,
      randomNonce: () => 'nonce-1',
    })

    await expect(coordinator.run(async () => ({ expiresAt: 1_500 }), new AbortController().signal))
      .resolves.toEqual({ expiresAt: 1_500 })
    expect(posted).toEqual([{
      type: 'refresh-result',
      nonce: 'nonce-1',
      outcome: 'success',
      issuedAt: 500,
      expiresAt: 1_500,
    }])
    expect(JSON.stringify(posted)).not.toContain('token')
  })

  it('ignores stale cross-tab messages and accepts only a newer credential-free result', () => {
    let handler: ((message: unknown) => void) | undefined
    const accepted: unknown[] = []
    const coordinator = new BrowserRefreshCoordinator({
      lockManager: null,
      channel: {
        postMessage: vi.fn(),
        close: vi.fn(),
        setMessageHandler: (next) => { handler = next },
      },
      now: () => 1_000,
      randomNonce: () => 'local',
    })
    coordinator.subscribe((message) => accepted.push(message))

    handler?.({ type: 'refresh-result', nonce: 'old', outcome: 'success', issuedAt: 900, expiresAt: 2_000 })
    handler?.({ type: 'refresh-result', nonce: 'new', outcome: 'success', issuedAt: 1_100, expiresAt: 2_100 })

    expect(accepted).toEqual([{
      type: 'refresh-result',
      nonce: 'new',
      outcome: 'success',
      issuedAt: 1_100,
      expiresAt: 2_100,
    }])
  })
})
