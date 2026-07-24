import type { components } from '@/modules/http/generated/admin'
import type { DictOption } from '@/types/common'

type MailLogDiagnostic = Pick<
  components['schemas']['Go_internal_module_mail_LogDTO_Output'],
  'verification_code' | 'verification_code_status' | 'verification_code_expires_at'
>

export type MailVerificationCodeStatus = NonNullable<MailLogDiagnostic['verification_code_status']>

const mailVerificationCodeStatuses: readonly MailVerificationCodeStatus[] = [
  'sending',
  'not_expired',
  'expired',
  'send_failed',
]
const mailVerificationCodeStatusSet = new Set<string>(mailVerificationCodeStatuses)

function isMailVerificationCodeStatus(value: string): value is MailVerificationCodeStatus {
  return mailVerificationCodeStatusSet.has(value)
}

function isValidVerificationCodeExpiry(value: string): boolean {
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2}) ([0-9]{2}):([0-9]{2}):([0-9]{2})$/.exec(value)
  if (match === null) return false

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match
  if (
    yearText === undefined || monthText === undefined || dayText === undefined
    || hourText === undefined || minuteText === undefined || secondText === undefined
  ) {
    return false
  }

  const [
    year = Number.NaN,
    month = Number.NaN,
    day = Number.NaN,
    hour = Number.NaN,
    minute = Number.NaN,
    second = Number.NaN,
  ] = [yearText, monthText, dayText, hourText, minuteText, secondText].map(Number)
  if (year < 1 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) {
    return false
  }

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const maximumDay = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
  return maximumDay !== undefined && day >= 1 && day <= maximumDay
}

export function assertMailLogDiagnostic(item: MailLogDiagnostic): void {
  const { verification_code: code, verification_code_status: codeStatus, verification_code_expires_at: codeExpiresAt } = item
  if (code === null && codeStatus === null && codeExpiresAt === null) return

  if (
    code === null || codeStatus === null || codeExpiresAt === null
    || !/^[0-9]{6}$/.test(code)
    || !isMailVerificationCodeStatus(codeStatus)
    || !isValidVerificationCodeExpiry(codeExpiresAt)
  ) {
    throw new Error('mail verification code diagnostic violates the contract')
  }
}

export function toMailVerificationCodeStatusOptions(
  options: components['schemas']['Go_internal_shared_dict_Option_string_Output'][],
): DictOption<MailVerificationCodeStatus>[] {
  if (options.length !== mailVerificationCodeStatuses.length) {
    throw new Error('mail verification code status dictionary violates the contract')
  }

  const seen = new Set<string>()
  const normalized = options.map((option) => {
    if (!isMailVerificationCodeStatus(option.value) || seen.has(option.value)) {
      throw new Error('mail verification code status dictionary violates the contract')
    }
    seen.add(option.value)
    return { label: option.label, value: option.value }
  })
  if (mailVerificationCodeStatuses.some((status) => !seen.has(status))) {
    throw new Error('mail verification code status dictionary violates the contract')
  }
  return normalized
}
