import { CommonEnum } from '@/enums'
import type { AuthPlatformAddPayload } from '@/api/permission/authPlatform'

export interface AuthPlatformForm extends Omit<AuthPlatformAddPayload, 'max_sessions'> {
  id?: number
  max_sessions: number
}

export type SessionMode = 'single' | 'limited' | 'unlimited'

export function sessionModeFromMaxSessions(maxSessions: number): SessionMode {
  if (maxSessions === 0) return 'unlimited'
  if (maxSessions === 1) return 'single'
  return 'limited'
}

export function maxSessionsForMode(mode: SessionMode, limitedValue: number): number {
  if (mode === 'unlimited') return 0
  if (mode === 'single') return 1
  return Math.min(100, Math.max(2, Math.trunc(limitedValue)))
}

export function createAuthPlatformDefaultForm(): AuthPlatformForm {
  return {
    code: '',
    name: '',
    login_types: ['password'],
    captcha_type: 'slide',
    access_ttl: 14400,
    refresh_ttl: 1209600,
    bind_platform: CommonEnum.YES,
    bind_device: CommonEnum.NO,
    bind_ip: CommonEnum.NO,
    max_sessions: 1,
    allow_register: CommonEnum.YES,
  }
}
