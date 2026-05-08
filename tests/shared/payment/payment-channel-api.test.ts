import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('payment channel api', () => {
  it('uses new payment REST paths and strict types', () => {
    const source = read('src/api/payment/channel.ts')
    expect(source).toContain('request.get<PaymentChannelInitResponse>(`${ADMIN_API_PREFIX}/payment/channels/page-init`)')
    expect(source).toContain('request.post<PaymentChannelCreateResponse, PaymentChannelMutationPayload>(`${ADMIN_API_PREFIX}/payment/channels`')
    expect(source).toContain('function positiveID(value: number): number')
    expect(source).toContain('if (!Number.isInteger(value) || value <= 0) throw new Error(\'payment channel id must be positive\')')
    expect(source).not.toContain('/pay-channels')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
