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

export interface DesktopRefreshCredential {
  readonly refreshToken: string
  readonly expiresAt: number
}

export interface NativeBridge {
  readonly available: boolean
  sealRefreshCredential(credential: DesktopRefreshCredential): Promise<void>
  refreshAccessCredential(apiOrigin: URL, signal: AbortSignal): Promise<AccessCredential>
  revokeAccessCredential(apiOrigin: URL, accessToken: string | null, signal: AbortSignal): Promise<void>
  clearRefreshCredential(): Promise<void>
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

  async restore(signal: AbortSignal): Promise<AccessCredential | null> {
    try {
      return await this.refresh(signal)
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
    await this.bridge.sealRefreshCredential({
      refreshToken: parsed.data.refresh_token,
      expiresAt: this.now() + parsed.data.refresh_expires_in * 1_000,
    })
    return {
      accessToken: parsed.data.access_token,
      expiresAt: this.now() + parsed.data.expires_in * 1_000,
    }
  }

  refresh(signal: AbortSignal): Promise<AccessCredential> {
    this.assertAvailable()
    return this.bridge.refreshAccessCredential(new URL(this.apiOrigin()), signal)
  }

  revoke(accessToken: string | null, signal: AbortSignal): Promise<void> {
    this.assertAvailable()
    return this.bridge.revokeAccessCredential(new URL(this.apiOrigin()), accessToken, signal)
  }

  clear(): Promise<void> {
    if (!this.bridge.available) return Promise.resolve()
    return this.bridge.clearRefreshCredential()
  }

  private assertAvailable(): void {
    if (!this.bridge.available) {
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

export function createUnavailableNativeBridge(): NativeBridge {
  const unavailable = () => Promise.reject(
    new AuthSessionError('auth.native_unavailable', 'native credential bridge is unavailable'),
  )
  return {
    available: false,
    sealRefreshCredential: unavailable,
    refreshAccessCredential: unavailable,
    revokeAccessCredential: unavailable,
    clearRefreshCredential: unavailable,
  }
}
