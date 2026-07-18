import { describe, expect, it, vi } from 'vitest'
import { AuthSession } from '@/modules/auth/session'
import {
  AuthSessionError,
  type AccessCredential,
  type CredentialAdapter,
} from '@/modules/auth/types'

const credential: AccessCredential = {
  accessToken: 'access-secret',
  expiresAt: Date.now() + 60_000,
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

function adapter(overrides: Partial<CredentialAdapter> = {}): CredentialAdapter {
  return {
    variant: 'browser',
    restore: vi.fn(async () => null),
    login: vi.fn(async () => credential),
    refresh: vi.fn(async () => credential),
    revoke: vi.fn(async () => undefined),
    clear: vi.fn(async () => undefined),
    ...overrides,
  }
}

function session(authAdapter = adapter(), overrides: ConstructorParameters<typeof AuthSession>[0] = {}) {
  return new AuthSession({
    adapter: authAdapter,
    refreshTimeoutMs: 5_000,
    ...overrides,
  })
}

describe('AuthSession', () => {
  it('restores each anonymous or authenticated session only once', async () => {
    const anonymousAdapter = adapter()
    const anonymous = session(anonymousAdapter)
    await expect(anonymous.restore()).resolves.toEqual({ kind: 'anonymous' })
    await expect(anonymous.restore()).resolves.toEqual({ kind: 'anonymous' })
    expect(anonymousAdapter.restore).toHaveBeenCalledTimes(1)

    const authenticatedAdapter = adapter({ restore: vi.fn(async () => credential) })
    const authenticated = session(authenticatedAdapter)
    await expect(authenticated.restore()).resolves.toEqual({ kind: 'authenticated' })
    await expect(authenticated.restore()).resolves.toEqual({ kind: 'authenticated' })
    expect(authenticatedAdapter.restore).toHaveBeenCalledTimes(1)
  })

  it('restores anonymous and authenticated sessions without exposing the token in its snapshot', async () => {
    const anonymous = session()
    await expect(anonymous.restore()).resolves.toEqual({ kind: 'anonymous' })
    expect(anonymous.state.value).toEqual({ kind: 'anonymous' })

    const authenticated = session(adapter({ restore: vi.fn(async () => credential) }))
    await expect(authenticated.restore()).resolves.toEqual({ kind: 'authenticated' })
    expect(authenticated.state.value).toEqual({ kind: 'authenticated', expiresAt: credential.expiresAt })
    expect(authenticated.state.value).not.toHaveProperty('accessToken')
    await expect(authenticated.withAccessToken(async (token) => token)).resolves.toBe('access-secret')
  })

  it('moves through authenticating and emits a credential-free authenticated event', async () => {
    const login = deferred<AccessCredential>()
    const auth = session(adapter({ login: vi.fn(() => login.promise) }))
    const events: unknown[] = []
    auth.subscribe((event) => events.push(event))
    await auth.restore()
    const pending = auth.login({
      login_type: 'password',
      login_account: 'admin@example.test',
      password: 'secret',
      captcha_id: 'captcha-id',
      captcha_answer: { x: 20, y: 0 },
    })

    expect(auth.state.value.kind).toBe('authenticating')
    login.resolve(credential)
    await pending

    expect(auth.state.value.kind).toBe('authenticated')
    expect(events).toContainEqual({ type: 'authenticated', expiresAt: credential.expiresAt })
    expect(JSON.stringify(events)).not.toContain('access-secret')
  })

  it('coalesces twenty refresh callers into one adapter rotation', async () => {
    const refresh = deferred<AccessCredential>()
    const authAdapter = adapter({
      restore: vi.fn(async () => credential),
      refresh: vi.fn(() => refresh.promise),
    })
    const auth = session(authAdapter)
    await auth.restore()

    const callers = Array.from({ length: 20 }, () => auth.refresh())
    expect(auth.state.value.kind).toBe('refreshing')
    expect(authAdapter.refresh).toHaveBeenCalledTimes(1)
    refresh.resolve({ ...credential, expiresAt: credential.expiresAt + 60_000 })

    await expect(Promise.all(callers)).resolves.toHaveLength(20)
    expect(authAdapter.refresh).toHaveBeenCalledTimes(1)
    expect(auth.state.value.kind).toBe('authenticated')
  })

  it('aborts one waiting caller without canceling the shared refresh flight', async () => {
    const refresh = deferred<AccessCredential>()
    const auth = session(adapter({
      restore: vi.fn(async () => credential),
      refresh: vi.fn(() => refresh.promise),
    }))
    await auth.restore()
    const controller = new AbortController()

    const canceled = auth.refresh(controller.signal)
    const survivor = auth.refresh()
    controller.abort(new DOMException('superseded', 'AbortError'))
    refresh.resolve(credential)

    await expect(canceled).rejects.toMatchObject({ name: 'AbortError' })
    await expect(survivor).resolves.toMatchObject({ kind: 'authenticated' })
  })

  it('expires deterministically when refresh exceeds its timeout', async () => {
    vi.useFakeTimers()
    const auth = session(adapter({
      restore: vi.fn(async () => credential),
      refresh: vi.fn(() => new Promise<AccessCredential>(() => undefined)),
    }), { refreshTimeoutMs: 500 })
    await auth.restore()
    const refresh = auth.refresh()
    const rejection = expect(refresh).rejects.toMatchObject({ name: 'TimeoutError' })

    await vi.advanceTimersByTimeAsync(500)

    await rejection
    expect(auth.state.value).toEqual({ kind: 'expired', reason: 'timeout' })
    vi.useRealTimers()
  })

  it('waits offline and refreshes after the online gate opens', async () => {
    const online = deferred<void>()
    let connected = false
    const authAdapter = adapter({
      restore: vi.fn(async () => credential),
      refresh: vi.fn(async () => credential),
    })
    const auth = session(authAdapter, {
      connectivity: {
        isOnline: () => connected,
        waitUntilOnline: () => online.promise,
      },
    })
    await auth.restore()
    const refresh = auth.refresh()
    expect(authAdapter.refresh).not.toHaveBeenCalled()

    connected = true
    online.resolve()

    await expect(refresh).resolves.toMatchObject({ kind: 'authenticated' })
    expect(authAdapter.refresh).toHaveBeenCalledTimes(1)
  })

  it('logs out in the required cleanup order and freezes new authenticated work', async () => {
    const order: string[] = []
    const authAdapter = adapter({
      restore: vi.fn(async () => credential),
      revoke: vi.fn(async () => { order.push('revoke') }),
      clear: vi.fn(async () => { order.push('credential-clear') }),
    })
    const auth = session(authAdapter, {
      logoutHooks: {
        disconnectRealtime: async () => { order.push('realtime') },
        abortAuthenticatedRequests: async () => { order.push('abort-requests') },
        removeRoutes: async () => { order.push('routes') },
        clearPrincipal: async () => { order.push('principal') },
        clearIdentityPersistence: async () => { order.push('persistence') },
        navigateToLogin: async () => { order.push('navigate') },
      },
    })
    await auth.restore()
    const logout = auth.logout()

    expect(auth.state.value.kind).toBe('logging-out')
    await expect(auth.withAccessToken(async () => 'unexpected')).rejects.toMatchObject({
      code: 'auth.session_frozen',
    })
    await logout

    expect(order).toEqual([
      'revoke',
      'realtime',
      'abort-requests',
      'routes',
      'principal',
      'persistence',
      'credential-clear',
      'navigate',
    ])
    expect(auth.state.value).toEqual({ kind: 'anonymous' })
  })

  it('rejects missing sessions and every invalid credential shape', async () => {
    const missing = session()
    await expect(missing.refresh()).rejects.toMatchObject({ code: 'auth.session_missing' })
    await expect(missing.withAccessToken(async () => 'unexpected')).rejects.toMatchObject({
      code: 'auth.session_missing',
    })

    const invalidCredentials: AccessCredential[] = [
      { accessToken: '', expiresAt: Date.now() + 60_000 },
      { accessToken: 'token', expiresAt: Number.NaN },
      { accessToken: 'token', expiresAt: Date.now() - 1 },
    ]
    for (const invalid of invalidCredentials) {
      const auth = session(adapter({ login: vi.fn(async () => invalid) }))
      await auth.restore()
      await expect(auth.login({
        login_type: 'password',
        login_account: 'admin@example.test',
        password: 'secret',
        captcha_id: 'captcha-id',
        captcha_answer: { x: 20, y: 0 },
      })).rejects.toMatchObject({ code: 'auth.credential_invalid' })
      expect(auth.state.value).toEqual({ kind: 'anonymous' })
    }
  })

  it.each([
    [new AuthSessionError('auth.revoked', 'revoked'), 'revoked'],
    [new Error('rotation failed'), 'rotation-failed'],
  ] as const)('classifies a failed refresh as %s', async (error, reason) => {
    const authAdapter = adapter({
      restore: vi.fn(async () => credential),
      refresh: vi.fn(async () => { throw error }),
    })
    const auth = session(authAdapter)
    const events: unknown[] = []
    auth.subscribe((event) => events.push(event))
    await auth.restore()

    await expect(auth.refresh()).rejects.toBe(error)
    expect(auth.state.value).toEqual({ kind: 'expired', reason })
    expect(events).toContainEqual({ type: 'expired', reason })
    expect(authAdapter.clear).toHaveBeenCalledTimes(1)
  })

  it('coalesces logout, ignores revoke failure, and permits a fresh anonymous login', async () => {
    const revoke = deferred<void>()
    const authAdapter = adapter({
      revoke: vi.fn(() => revoke.promise),
    })
    const auth = session(authAdapter)
    await auth.restore()

    const first = auth.logout()
    const second = auth.logout()
    expect(second).toBe(first)
    await expect(auth.login({
      login_type: 'password',
      login_account: 'admin@example.test',
      password: 'secret',
      captcha_id: 'captcha-id',
      captcha_answer: { x: 20, y: 0 },
    })).rejects.toMatchObject({ code: 'auth.session_frozen' })

    revoke.reject(new Error('best effort failure'))
    await first
    expect(authAdapter.revoke).toHaveBeenCalledWith(null, expect.any(AbortSignal))

    await expect(auth.login({
      login_type: 'password',
      login_account: 'admin@example.test',
      password: 'secret',
      captcha_id: 'captcha-id',
      captcha_answer: { x: 20, y: 0 },
    })).resolves.toMatchObject({ kind: 'authenticated' })
  })

  it('aborts and joins an active refresh before disposing its coordinator', async () => {
    const dispose = vi.fn()
    const authAdapter = adapter({
      restore: vi.fn(async () => credential),
      refresh: vi.fn(() => new Promise<AccessCredential>(() => undefined)),
    })
    const auth = session(authAdapter, {
      coordinator: {
        run: (operation) => operation(),
        dispose,
      },
    })
    await auth.restore()
    const refresh = auth.refresh()
    const rejection = expect(refresh).rejects.toMatchObject({ name: 'AbortError' })

    await auth.dispose()

    await rejection
    expect(dispose).toHaveBeenCalledTimes(1)
    expect(auth.state.value).toEqual({ kind: 'anonymous' })
  })
})
