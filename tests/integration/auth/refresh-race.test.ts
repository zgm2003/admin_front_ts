import { describe, expect, it, vi } from 'vitest'
import { BrowserCredentialAdapter } from '@/adapters/web/browser-credentials'
import { BrowserRefreshCoordinator } from '@/adapters/web/browser-coordinator'

function success(data: Record<string, unknown>) {
  return new Response(JSON.stringify({ code: 0, data, msg: 'success' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('browser credential transport', () => {
  it('uses the formal browser variant, credential cookie, and no refresh request body', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(success({ access_token: 'login-access', expires_in: 60 }))
      .mockResolvedValueOnce(success({ access_token: 'refresh-access', expires_in: 60 }))
    const adapter = new BrowserCredentialAdapter({
      apiOrigin: new URL('https://admin.example.test'),
      fetch,
      now: () => 1_000,
      headers: () => ({
        platform: 'admin',
        'device-id': 'device-1',
        'Accept-Language': 'zh-CN',
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
      headers: expect.objectContaining({
        'X-Admin-Client-Variant': 'browser',
        platform: 'admin',
        'device-id': 'device-1',
        'Accept-Language': 'zh-CN',
      }),
    }))
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      login_type: 'email',
      login_account: 'admin@example.test',
      code: '123456',
    })
    expect(fetch).toHaveBeenNthCalledWith(2, 'https://admin.example.test/api/admin/v1/auth/refresh', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: undefined,
      headers: {
        platform: 'admin',
        'device-id': 'device-1',
        'Accept-Language': 'zh-CN',
        'X-Admin-Client-Variant': 'browser',
      },
    }))
  })

  it('rejects a browser response that leaks a desktop refresh credential', async () => {
    const adapter = new BrowserCredentialAdapter({
      apiOrigin: new URL('https://admin.example.test'),
      fetch: vi.fn(async () => success({
        access_token: 'access',
        expires_in: 60,
        refresh_token: 'must-not-reach-browser',
        refresh_expires_in: 3600,
      })),
    })

    await expect(adapter.refresh(new AbortController().signal)).rejects.toMatchObject({
      code: 'auth.browser_refresh_credential_leak',
    })
  })

  it('revokes with bearer authentication and clears only through the cookie response', async () => {
    const fetch = vi.fn(async () => success({}))
    const adapter = new BrowserCredentialAdapter({
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
        'X-Admin-Client-Variant': 'browser',
      },
      signal,
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
