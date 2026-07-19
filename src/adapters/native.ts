import {
  AuthSessionError,
  type AccessCredential,
  type CredentialAdapter,
  type LoginCommand,
} from '@/modules/auth/types'
import {
  authCredentialSchema,
  errorEnvelopeSchema,
  successEnvelopeSchema,
} from '@/modules/http/schema'
import { createWebNativeBridge } from '@/adapters/web/native-bridge'
import type { NativeBridge } from '@/modules/native/types'

export { NativeUpdaterError } from '@/modules/native/types'

export type {
  DesktopRefreshCredential,
  ManagedDownloadProgress,
  NativeBridge,
  NativeUpdate,
  NativeWindowState,
  UpdaterDownloadEvent,
} from '@/modules/native/types'

let installedBridge: NativeBridge = createWebNativeBridge()

export async function createRuntimeNativeBridge(): Promise<NativeBridge> {
  const adapter = await import('@/adapters/tauri/native-bridge')
  return await adapter.isTauriRuntime()
    ? adapter.createTauriNativeBridge()
    : createWebNativeBridge()
}

export function installNativeBridge(bridge: NativeBridge): () => void {
  const previous = installedBridge
  installedBridge = bridge
  return () => {
    if (installedBridge === bridge) installedBridge = previous
  }
}

export function getNativeBridge(): NativeBridge {
  return installedBridge
}

export interface DesktopCredentialAdapterOptions {
  readonly apiOrigin: URL | (() => URL)
  readonly bridge: NativeBridge
  readonly fetch?: typeof fetch
  readonly now?: () => number
  readonly headers?: () => Readonly<Record<string, string>>
}

export class DesktopCredentialAdapter implements CredentialAdapter {
  readonly variant = 'desktop' as const

  private readonly apiOrigin: () => string
  private readonly bridge: NativeBridge
  private readonly fetch: typeof fetch
  private readonly now: () => number
  private readonly commonHeaders: () => Readonly<Record<string, string>>

  constructor(options: DesktopCredentialAdapterOptions) {
    const apiOrigin = options.apiOrigin
    this.apiOrigin = typeof apiOrigin === 'function'
      ? () => apiOrigin().origin
      : () => apiOrigin.origin
    this.bridge = options.bridge
    this.fetch = options.fetch ?? globalThis.fetch.bind(globalThis)
    this.now = options.now ?? Date.now
    this.commonHeaders = options.headers ?? (() => ({}))
  }

  async restore(): Promise<AccessCredential | null> {
    try {
      return await this.refresh()
    } catch (error) {
      if (error instanceof AuthSessionError && error.status === 401) return null
      throw error
    }
  }

  async login(input: LoginCommand, signal: AbortSignal): Promise<AccessCredential> {
    this.assertAvailable()
    const response = await this.fetch(`${this.apiOrigin()}/api/admin/v1/auth/login`, {
      method: 'POST',
      credentials: 'omit',
      headers: {
        ...this.commonHeaders(),
        'X-Admin-Client-Variant': 'desktop',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal,
    })
    const payload = await this.readEnvelope(response)
    const parsed = authCredentialSchema.safeParse(payload)
    if (!parsed.success || !parsed.data.refresh_token || !parsed.data.refresh_expires_in) {
      throw new AuthSessionError(
        'auth.desktop_credential_contract_invalid',
        'desktop credential response violates the Admin contract',
      )
    }
    let refreshToken: string | null = parsed.data.refresh_token
    try {
      await this.bridge.credentials.seal({ refreshToken })
    } finally {
      refreshToken = null
    }
    return {
      accessToken: parsed.data.access_token,
      expiresAt: this.now() + parsed.data.expires_in * 1_000,
    }
  }

  async refresh(): Promise<AccessCredential> {
    this.assertAvailable()
    const deviceId = this.commonHeaders()['device-id']
    if (!deviceId) {
      throw new AuthSessionError(
        'auth.desktop_device_contract_invalid',
        'desktop refresh requires the documented device-id header',
      )
    }
    return this.bridge.credentials.refresh(deviceId)
  }

  async revoke(accessToken: string | null, signal: AbortSignal): Promise<void> {
    this.assertAvailable()
    const headers: Record<string, string> = {
      ...this.commonHeaders(),
      'X-Admin-Client-Variant': 'desktop',
    }
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    const response = await this.fetch(`${this.apiOrigin()}/api/admin/v1/auth/logout`, {
      method: 'POST',
      credentials: 'omit',
      headers,
      signal,
    })
    await this.readEnvelope(response)
  }

  async clear(): Promise<void> {
    if (this.bridge.kind !== 'tauri') return
    await this.bridge.credentials.clear()
  }

  private assertAvailable(): void {
    if (this.bridge.kind !== 'tauri') {
      throw new AuthSessionError('auth.native_unavailable', 'native credential bridge is unavailable')
    }
  }

  private async readEnvelope(response: Response): Promise<unknown> {
    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new AuthSessionError('auth.response_invalid', 'authentication response is not JSON', {
        status: response.status,
      })
    }
    const success = successEnvelopeSchema.safeParse(payload)
    if (response.ok && success.success) return success.data.data
    const failure = errorEnvelopeSchema.safeParse(payload)
    if (failure.success) {
      throw new AuthSessionError(failure.data.error.code, failure.data.msg, {
        status: response.status,
        retryable: failure.data.error.retryable,
      })
    }
    throw new AuthSessionError('auth.response_invalid', 'authentication response violates the Admin contract', {
      status: response.status,
    })
  }
}
