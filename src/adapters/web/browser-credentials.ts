import { z } from 'zod'
import {
  AuthSessionError,
  type AccessCredential,
  type CredentialAdapter,
  type LoginCommand,
} from '@/modules/auth/types'

const successEnvelopeSchema = z.object({
  code: z.literal(0),
  data: z.unknown(),
  msg: z.string(),
}).passthrough()

const browserCredentialSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
}).strict()

interface BrowserCredentialAdapterOptions {
  readonly apiOrigin: URL
  readonly fetch?: typeof fetch
  readonly now?: () => number
}

export class BrowserCredentialAdapter implements CredentialAdapter {
  readonly variant = 'browser' as const

  private readonly apiOrigin: string
  private readonly fetch: typeof fetch
  private readonly now: () => number

  constructor(options: BrowserCredentialAdapterOptions) {
    this.apiOrigin = options.apiOrigin.origin
    this.fetch = options.fetch ?? globalThis.fetch.bind(globalThis)
    this.now = options.now ?? Date.now
  }

  async restore(signal: AbortSignal): Promise<AccessCredential | null> {
    try {
      return await this.refresh(signal)
    } catch (error) {
      if (error instanceof AuthSessionError && error.status === 401) return null
      throw error
    }
  }

  login(input: LoginCommand, signal: AbortSignal): Promise<AccessCredential> {
    return this.requestCredential('/api/admin/v1/auth/login', signal, input)
  }

  refresh(signal: AbortSignal): Promise<AccessCredential> {
    return this.requestCredential('/api/admin/v1/auth/refresh', signal)
  }

  async revoke(accessToken: string | null, signal: AbortSignal): Promise<void> {
    const headers: Record<string, string> = {
      'X-Admin-Client-Variant': 'browser',
    }
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    const response = await this.fetch(`${this.apiOrigin}/api/admin/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers,
      signal,
    })
    await this.readEnvelope(response)
  }

  async clear(): Promise<void> {
    // Browser refresh state is an HttpOnly cookie and can only be cleared by the backend response.
  }

  private async requestCredential(
    path: string,
    signal: AbortSignal,
    body?: LoginCommand,
  ): Promise<AccessCredential> {
    const headers: Record<string, string> = {
      'X-Admin-Client-Variant': 'browser',
    }
    if (body) headers['Content-Type'] = 'application/json'
    const response = await this.fetch(`${this.apiOrigin}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })
    const data = await this.readEnvelope(response)
    if (typeof data === 'object' && data !== null && ('refresh_token' in data || 'refresh_expires_in' in data)) {
      throw new AuthSessionError(
        'auth.browser_refresh_credential_leak',
        'browser response exposed a desktop refresh credential',
      )
    }
    const parsed = browserCredentialSchema.safeParse(data)
    if (!parsed.success) {
      throw new AuthSessionError('auth.credential_contract_invalid', 'credential response violates the Admin contract')
    }
    return {
      accessToken: parsed.data.access_token,
      expiresAt: this.now() + parsed.data.expires_in * 1_000,
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
    const parsed = successEnvelopeSchema.safeParse(payload)
    if (!response.ok || !parsed.success) {
      const backendError = typeof payload === 'object' && payload !== null && 'error' in payload
        ? (payload as { error?: { code?: unknown } }).error
        : undefined
      const code = typeof backendError?.code === 'string' ? backendError.code : 'auth.request_failed'
      throw new AuthSessionError(code, 'authentication request failed', {
        status: response.status,
        retryable: response.status >= 500,
      })
    }
    return parsed.data.data
  }
}
