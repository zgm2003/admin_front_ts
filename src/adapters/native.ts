import type { AccessCredential } from '@/modules/auth/types'

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
