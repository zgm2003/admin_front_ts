import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PermissionCode } from '@/modules/routing/generated/permissions'

const { executeAdminOperation } = vi.hoisted(() => ({
  executeAdminOperation: vi.fn(),
}))

vi.mock('@/lib/http', () => ({ executeAdminOperation }))

import { MailApi } from '@/api/system/mail'

const permission: PermissionCode = 'system_mail_logView'
void permission

const emptyPage = {
  current_page: 1,
  page_size: 20,
  total: 1,
  total_page: 1,
}

function mailLog(diagnostic: Record<string, unknown>) {
  return {
    id: 1,
    scene: 'login',
    template_id: 2,
    to_email: 'admin@example.com',
    subject: 'Sign in',
    status: 1,
    tencent_request_id: 'request-id',
    tencent_message_id: 'message-id',
    error_code: '',
    error_message: '',
    duration_ms: 12,
    sent_at: '2026-07-24 10:00:00',
    created_at: '2026-07-24 10:00:00',
    updated_at: '2026-07-24 10:00:00',
    ...diagnostic,
  }
}

function pageInit(statuses: Array<{ label: string; value: string }>) {
  return {
    dict: {
      common_status_arr: [],
      mail_scene_arr: [],
      mail_log_scene_arr: [],
      mail_log_status_arr: [],
      mail_verification_code_status_arr: statuses,
      mail_region_arr: [],
      default_region: 'ap-guangzhou',
      default_endpoint: 'ses.tencentcloudapi.com',
      default_ttl_minutes: 5,
    },
  }
}

function resolve(value: unknown) {
  executeAdminOperation.mockResolvedValueOnce(value)
}

afterEach(() => vi.resetAllMocks())

describe('mail diagnostic contract', () => {
  it.each([
    ['sending'],
    ['not_expired'],
    ['expired'],
    ['send_failed'],
  ])('decodes the %s verification-code status for both list and detail', async (verification_code_status) => {
    const diagnostic = {
      verification_code: '012345',
      verification_code_status,
      verification_code_expires_at: '2024-02-29 23:59:59',
    }
    resolve({ list: [mailLog(diagnostic)], page: emptyPage })
    resolve(mailLog(diagnostic))

    await expect(MailApi.logs({ current_page: 1, page_size: 20 })).resolves.toMatchObject({
      list: [diagnostic],
    })
    await expect(MailApi.log(1)).resolves.toMatchObject(diagnostic)
  })

  it('decodes an all-null diagnostic tuple for both list and detail', async () => {
    const diagnostic = {
      verification_code: null,
      verification_code_status: null,
      verification_code_expires_at: null,
    }
    resolve({ list: [mailLog(diagnostic)], page: emptyPage })
    resolve(mailLog(diagnostic))

    await expect(MailApi.logs({ current_page: 1, page_size: 20 })).resolves.toMatchObject({
      list: [diagnostic],
    })
    await expect(MailApi.log(1)).resolves.toMatchObject(diagnostic)
  })

  it.each([
    ['lower Gregorian boundary', '1000-01-01 00:00:00'],
    ['ordinary Gregorian date', '2026-07-24 10:00:00'],
    ['Gregorian leap day', '2024-02-29 23:59:59'],
    ['upper Gregorian boundary', '9999-12-31 23:59:59'],
  ])('accepts the %s verification-code expiry timestamp', async (_name, verification_code_expires_at) => {
    const diagnostic = {
      verification_code: '123456',
      verification_code_status: 'sending',
      verification_code_expires_at,
    }
    resolve({ list: [mailLog(diagnostic)], page: emptyPage })

    await expect(MailApi.logs({ current_page: 1, page_size: 20 })).resolves.toMatchObject({
      list: [diagnostic],
    })
  })

  it.each([
    [{ verification_code: null, verification_code_status: 'sending', verification_code_expires_at: '2026-07-24 10:00:00' }],
    [{ verification_code: '123456', verification_code_status: null, verification_code_expires_at: '2026-07-24 10:00:00' }],
    [{ verification_code: '123456', verification_code_status: 'sending', verification_code_expires_at: null }],
    [{ verification_code: null, verification_code_status: null, verification_code_expires_at: '2026-07-24 10:00:00' }],
    [{ verification_code: null, verification_code_status: 'sending', verification_code_expires_at: null }],
    [{ verification_code: '123456', verification_code_status: null, verification_code_expires_at: null }],
    [{ verification_code: '１２３４５６', verification_code_status: 'sending', verification_code_expires_at: '2026-07-24 10:00:00' }],
    [{ verification_code: '12345', verification_code_status: 'sending', verification_code_expires_at: '2026-07-24 10:00:00' }],
    [{ verification_code: '1234567', verification_code_status: 'sending', verification_code_expires_at: '2026-07-24 10:00:00' }],
    [{ verification_code: '12345a', verification_code_status: 'sending', verification_code_expires_at: '2026-07-24 10:00:00' }],
    [{ verification_code: '123456', verification_code_status: 'not_used', verification_code_expires_at: '2026-07-24 10:00:00' }],
    [{ verification_code: '123456', verification_code_status: 'sending', verification_code_expires_at: '2026-07-24T10:00:00Z' }],
    [{ verification_code: '123456', verification_code_status: 'sending', verification_code_expires_at: '2026-02-29 10:00:00' }],
    [{ verification_code: '123456', verification_code_status: 'sending', verification_code_expires_at: '2026-13-01 10:00:00' }],
    [{ verification_code: '123456', verification_code_status: 'sending', verification_code_expires_at: '2026-01-00 10:00:00' }],
    [{ verification_code: '123456', verification_code_status: 'sending', verification_code_expires_at: '2024-04-31 10:00:00' }],
    [{ verification_code: '123456', verification_code_status: 'sending', verification_code_expires_at: '2026-01-01 24:00:00' }],
    [{ verification_code: '123456', verification_code_status: 'sending', verification_code_expires_at: '2026-01-01 23:60:00' }],
    [{ verification_code: '123456', verification_code_status: 'sending', verification_code_expires_at: '2026-01-01 23:59:60' }],
    [{ verification_code: '123456', verification_code_status: 'sending', verification_code_expires_at: '2026-01-01 23:59:59.000' }],
    [{ verification_code: '123456', verification_code_status: 'sending', verification_code_expires_at: '2026-01-01 23:59:59+08:00' }],
  ])('rejects an invalid diagnostic tuple from both list and detail', async (diagnostic) => {
    resolve({ list: [mailLog(diagnostic)], page: emptyPage })
    resolve(mailLog(diagnostic))

    await Promise.all([
      expect(MailApi.logs({ current_page: 1, page_size: 20 })).rejects.toThrow(/verification code/i),
      expect(MailApi.log(1)).rejects.toThrow(/verification code/i),
    ])
  })

  it('rejects the whole list when a later diagnostic tuple is invalid', async () => {
    resolve({
      list: [
        mailLog({ verification_code: null, verification_code_status: null, verification_code_expires_at: null }),
        mailLog({ verification_code: '123456', verification_code_status: 'used', verification_code_expires_at: '2026-07-24 10:00:00' }),
      ],
      page: emptyPage,
    })

    await expect(MailApi.logs({ current_page: 1, page_size: 20 })).rejects.toThrow(/verification code/i)
  })

  it('accepts exactly one opaque dictionary option for every verification-code status', async () => {
    resolve(pageInit([
      { label: 'delivery running', value: 'sending' },
      { label: 'still active', value: 'not_expired' },
      { label: 'time elapsed', value: 'expired' },
      { label: 'delivery rejected', value: 'send_failed' },
    ]))
    await expect(MailApi.pageInit()).resolves.toMatchObject({
      dict: { mail_verification_code_status_arr: [
        { label: 'delivery running', value: 'sending' },
        { label: 'still active', value: 'not_expired' },
        { label: 'time elapsed', value: 'expired' },
        { label: 'delivery rejected', value: 'send_failed' },
      ] },
    })

  })

  it.each([
    ['missing status', [
      { label: 'sending', value: 'sending' },
      { label: 'not expired', value: 'not_expired' },
      { label: 'expired', value: 'expired' },
    ]],
    ['duplicate status', [
      { label: 'first', value: 'sending' },
      { label: 'duplicate', value: 'sending' },
      { label: 'not expired', value: 'not_expired' },
      { label: 'expired', value: 'expired' },
      { label: 'failed', value: 'send_failed' },
    ]],
    ['unknown status', [
      { label: 'sending', value: 'sending' },
      { label: 'not expired', value: 'not_expired' },
      { label: 'expired', value: 'expired' },
      { label: 'unknown', value: 'used' },
    ]],
  ])('rejects a diagnostic dictionary with a %s', async (_reason, statuses) => {
    resolve(pageInit(statuses))
    await expect(MailApi.pageInit()).rejects.toThrow(/verification code status dictionary/i)
  })

  it('forwards the exact execute options and abort signal for list and detail', async () => {
    const controller = new AbortController()
    const options = { signal: controller.signal }
    const diagnostic = { verification_code: null, verification_code_status: null, verification_code_expires_at: null }
    resolve({ list: [mailLog(diagnostic)], page: emptyPage })
    resolve(mailLog(diagnostic))

    await MailApi.logs({ current_page: 1, page_size: 20 }, options)
    await MailApi.log(1, options)

    expect(executeAdminOperation.mock.calls[0]?.[2]).toBe(options)
    expect(executeAdminOperation.mock.calls[0]?.[2]?.signal).toBe(controller.signal)
    expect(executeAdminOperation.mock.calls[1]?.[2]).toBe(options)
    expect(executeAdminOperation.mock.calls[1]?.[2]?.signal).toBe(controller.signal)
  })
})
