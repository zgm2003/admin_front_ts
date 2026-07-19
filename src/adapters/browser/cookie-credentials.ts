import { z } from 'zod'
import {
  AuthSessionError,
  type AccessCredential,
  type CredentialAdapter,
  type LoginCommand,
} from '@/modules/auth/types'
import { errorEnvelopeSchema, successEnvelopeSchema } from '@/modules/http/schema'

const credentialSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
}).strict()
const logoutSchema = z.object({}).strict()

interface CookieCredentialAdapterOptions {
  readonly apiOrigin: URL | (() => URL)
  readonly fetch?: typeof fetch
  readonly now?: () => number
  readonly headers?: () => Readonly<Record<string, string>>
}

export class CookieCredentialAdapter implements CredentialAdapter {
  private readonly apiOrigin: () => string
  private readonly fetch: typeof fetch
  private readonly now: () => number
  private readonly commonHeaders: () => Readonly<Record<string, string>>

  constructor(options: CookieCredentialAdapterOptions) {
    const apiOrigin = options.apiOrigin
    this.apiOrigin = typeof apiOrigin === 'function'
      ? () => apiOrigin().origin
      : () => apiOrigin.origin
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

  login(input: LoginCommand, signal: AbortSignal): Promise<AccessCredential> {
    return this.requestCredential('/api/admin/v1/auth/login', signal, input)
  }

  refresh(signal: AbortSignal): Promise<AccessCredential> {
    return this.requestCredential('/api/admin/v1/auth/refresh', signal)
  }

  async revoke(accessToken: string | null, signal: AbortSignal): Promise<void> {
    const headers: Record<string, string> = {
      ...this.commonHeaders(),
    }
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    const response = await this.fetch(`${this.apiOrigin()}/api/admin/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers,
      signal,
    })
    const data = await this.readEnvelope(response)
    if (!logoutSchema.safeParse(data).success) {
      throw new AuthSessionError('auth.logout_contract_invalid', 'logout response violates the Admin contract')
    }
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
      ...this.commonHeaders(),
    }
    if (body) headers['Content-Type'] = 'application/json'
    const init: RequestInit = {
      method: 'POST',
      credentials: 'include',
      headers,
      signal,
    }
    if (body) init.body = JSON.stringify(body)
    const response = await this.fetch(`${this.apiOrigin()}${path}`, init)
    const data = await this.readEnvelope(response)
    const parsed = credentialSchema.safeParse(data)
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
