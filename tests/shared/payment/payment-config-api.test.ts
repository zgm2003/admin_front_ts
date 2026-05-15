import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const loose = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('payment config api', () => {
  it('uses config REST paths and strict payloads', () => {
    const source = read('src/api/payment/config.ts')
    expect(source).toContain('request.get<PaymentConfigInitResponse>(`${ADMIN_API_PREFIX}/payment/configs/page-init`)')
    expect(source).toContain('request.post<PaymentConfigCreateResponse, PaymentConfigMutationPayload>(`${ADMIN_API_PREFIX}/payment/configs`')
    expect(source).toContain('request.post<PaymentCertificateUploadResponse, FormData>(`${ADMIN_API_PREFIX}/payment/certificates`')
    expect(source).toContain('request.post<PaymentConfigTestResponse>(`${ADMIN_API_PREFIX}/payment/configs/${positiveID(id)}/test`)')
    expect(source).not.toContain('/payment/channels')
    expect(source).not.toContain('/payment/orders')
    expect(source).not.toContain('/payment/events')
    expect(source).toContain("export type PaymentProvider = 'alipay'")
    expect(source).toContain('provider: PaymentProvider')
    expect(source).toContain('private_key_hint: string')
    expect(source).not.toContain('app_private_key_hint')
    expect(source).not.toContain('return_url')
    expect(source).not.toContain('merchant_id')
    expect(source).not.toContain('sign_type')
    expect(source).not.toContain('extra_config')
    expect(source).not.toMatch(loose)
  })
})
