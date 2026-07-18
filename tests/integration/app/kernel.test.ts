import { describe, expect, it, vi } from 'vitest'
import { AppKernel, type AppKernelDependencies } from '@/app/kernel'
import { isProtectedContentVisible, type PrincipalSnapshot } from '@/app/state'
import type { AppEnvironment } from '@/app/environment'

const appEnvironment: AppEnvironment = {
  mode: 'test',
  platform: 'admin',
  apiOrigin: new URL('http://localhost:5173'),
  realtimeOrigin: new URL('ws://localhost:5173/api/admin/v1/realtime/ws'),
  clientVariant: 'browser',
}

const principal: PrincipalSnapshot = {
  userId: 7,
  username: 'admin',
  avatar: '',
  roleName: 'administrator',
  buttonCodes: new Set(),
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

function dependencies(overrides: Partial<AppKernelDependencies> = {}): AppKernelDependencies {
  return {
    environment: () => appEnvironment,
    auth: {
      restore: vi.fn(async () => ({ kind: 'anonymous' as const })),
      dispose: vi.fn(async () => undefined),
    },
    principal: {
      load: vi.fn(async () => principal),
      clear: vi.fn(async () => undefined),
    },
    routes: {
      install: vi.fn(async () => undefined),
      clear: vi.fn(async () => undefined),
    },
    realtime: {
      connect: vi.fn(async () => undefined),
      disconnect: vi.fn(async () => undefined),
      dispose: vi.fn(async () => undefined),
      subscribe: vi.fn(() => () => undefined),
      retainTopic: vi.fn(() => () => undefined),
      registerRecovery: vi.fn(() => () => undefined),
    },
    adapters: [],
    ...overrides,
  }
}

describe('AppKernel bootstrap', () => {
  it('moves from cold through restoring-session to anonymous', async () => {
    const restore = deferred<{ kind: 'anonymous' }>()
    const deps = dependencies({
      auth: {
        restore: vi.fn(() => restore.promise),
        dispose: vi.fn(async () => undefined),
      },
    })
    const kernel = new AppKernel(deps)
    const bootstrap = kernel.bootstrap()

    expect(kernel.state.value.kind).toBe('restoring-session')
    restore.resolve({ kind: 'anonymous' })
    await expect(bootstrap).resolves.toEqual({ kind: 'anonymous' })
  })

  it('loads the principal, installs routes, and only then becomes ready', async () => {
    const principalLoad = deferred<PrincipalSnapshot>()
    const routeInstall = deferred<void>()
    const deps = dependencies({
      auth: {
        restore: vi.fn(async () => ({ kind: 'authenticated' as const })),
        dispose: vi.fn(async () => undefined),
      },
      principal: {
        load: vi.fn(() => principalLoad.promise),
        clear: vi.fn(async () => undefined),
      },
      routes: {
        install: vi.fn(() => routeInstall.promise),
        clear: vi.fn(async () => undefined),
      },
    })
    const kernel = new AppKernel(deps)
    const bootstrap = kernel.bootstrap()
    await vi.waitFor(() => expect(kernel.state.value.kind).toBe('loading-principal'))

    principalLoad.resolve(principal)
    await vi.waitFor(() => expect(kernel.state.value.kind).toBe('installing-routes'))
    expect(isProtectedContentVisible(kernel.state.value)).toBe(false)
    routeInstall.resolve()

    await expect(bootstrap).resolves.toEqual({ kind: 'ready', principal })
    expect(isProtectedContentVisible(kernel.state.value)).toBe(true)
  })

  it('starts exactly one authenticated realtime context without blocking ready state', async () => {
    const realtimeConnect = deferred<void>()
    const connect = vi.fn(() => realtimeConnect.promise)
    const deps = dependencies({
      auth: {
        restore: vi.fn(async () => ({ kind: 'authenticated' as const })),
        dispose: vi.fn(async () => undefined),
      },
      realtime: {
        connect,
        disconnect: vi.fn(async () => undefined),
        dispose: vi.fn(async () => undefined),
        subscribe: vi.fn(() => () => undefined),
        retainTopic: vi.fn(() => () => undefined),
        registerRecovery: vi.fn(() => () => undefined),
      },
    })
    const kernel = new AppKernel(deps)

    await expect(kernel.bootstrap()).resolves.toEqual({ kind: 'ready', principal })
    await expect(kernel.bootstrap()).resolves.toEqual({ kind: 'ready', principal })

    expect(connect).toHaveBeenCalledTimes(1)
    expect(connect).toHaveBeenCalledWith({ userId: 7, platform: 'admin' })
    realtimeConnect.resolve()
  })

  it('maps invalid startup configuration to the failed state', async () => {
    const kernel = new AppKernel(dependencies({
      environment: () => {
        throw new Error('VITE_PLATFORM must be admin')
      },
    }))

    const result = await kernel.bootstrap()

    expect(result.kind).toBe('failed')
    expect(result.kind === 'failed' && result.error.kind).toBe('contract')
  })

  it('shares one bootstrap flight across repeated calls', async () => {
    const deps = dependencies()
    const kernel = new AppKernel(deps)

    const [first, second] = await Promise.all([kernel.bootstrap(), kernel.bootstrap()])

    expect(first).toEqual({ kind: 'anonymous' })
    expect(second).toEqual(first)
    expect(deps.auth.restore).toHaveBeenCalledTimes(1)
  })

  it('aborts principal loading and releases every dependency exactly once on disposal', async () => {
    const install = vi.fn(async () => undefined)
    const adapterDispose = vi.fn(async () => undefined)
    const deps = dependencies({
      auth: {
        restore: vi.fn(async () => ({ kind: 'authenticated' as const })),
        dispose: vi.fn(async () => undefined),
      },
      principal: {
        load: vi.fn((signal) => new Promise<PrincipalSnapshot>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), { once: true })
        })),
        clear: vi.fn(async () => undefined),
      },
      routes: {
        install,
        clear: vi.fn(async () => undefined),
      },
      adapters: [{ dispose: adapterDispose }],
    })
    const kernel = new AppKernel(deps)
    const bootstrap = kernel.bootstrap()
    await vi.waitFor(() => expect(kernel.state.value.kind).toBe('loading-principal'))

    await Promise.all([kernel.dispose(), kernel.dispose()])

    await expect(bootstrap).resolves.toEqual({ kind: 'cold' })
    expect(install).not.toHaveBeenCalled()
    expect(deps.realtime.dispose).toHaveBeenCalledTimes(1)
    expect(deps.routes.clear).toHaveBeenCalledTimes(1)
    expect(deps.principal.clear).toHaveBeenCalledTimes(1)
    expect(deps.auth.dispose).toHaveBeenCalledTimes(1)
    expect(adapterDispose).toHaveBeenCalledTimes(1)
  })

  it('rejects new lifecycle work after disposal without touching authentication', async () => {
    const login = vi.fn(async () => undefined)
    const deps = dependencies({
      auth: {
        restore: vi.fn(async () => ({ kind: 'anonymous' as const })),
        login,
        logout: vi.fn(async () => undefined),
        dispose: vi.fn(async () => undefined),
      },
    })
    const kernel = new AppKernel(deps)
    await kernel.dispose()

    await expect(kernel.bootstrap()).resolves.toEqual({ kind: 'cold' })
    await expect(kernel.login({
      login_type: 'password',
      login_account: 'admin',
      password: 'secret',
    })).resolves.toEqual({ kind: 'cold' })
    await expect(kernel.refreshPrincipal('manual')).resolves.toBeUndefined()
    expect(login).not.toHaveBeenCalled()
  })

  it.each(['cold', 'restoring-session', 'anonymous', 'loading-principal', 'installing-routes', 'failed'] as const)(
    'does not expose protected content while state is %s',
    (kind) => {
      const state = kind === 'failed'
        ? { kind, error: { kind: 'internal' as const, retryable: false, messageKey: 'failed' } }
        : { kind }
      expect(isProtectedContentVisible(state)).toBe(false)
    },
  )
})
