import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('payment event api', () => {
  it('uses new payment event REST paths and no old notify routes', () => {
    const source = read('src/api/payment/event.ts')
    expect(source).toContain('request.get<PaginatedResponse<PaymentEventListItem>>(`${ADMIN_API_PREFIX}/payment/events`')
    expect(source).not.toContain('/pay-notify-logs')
    expect(source).not.toContain('/pay-transactions')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
