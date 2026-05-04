import { CommonEnum } from '@/enums'
import type { AuthPlatformAddPayload } from '@/api/permission/authPlatform'

export interface AuthPlatformForm extends AuthPlatformAddPayload {
  id?: number
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
    single_session: CommonEnum.YES,
    max_sessions: 1,
    allow_register: CommonEnum.YES,
  }
}
