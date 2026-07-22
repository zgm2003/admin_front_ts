import { isApiError } from '@/modules/http/error'

export function isCaptchaChallengeError(error: unknown): boolean {
  return isApiError(error)
    && (error.code === 'captcha.required' || error.code === 'captcha.invalid_or_expired')
}
