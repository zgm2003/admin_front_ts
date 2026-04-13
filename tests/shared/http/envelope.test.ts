import { describe, expect, it } from 'vitest'

const { isApiEnvelope } = await import('../../../src/lib/http/envelope')

describe('http envelope', () => {
  it('recognizes a standard api envelope shape', () => {
    expect(isApiEnvelope({
      code: 0,
      msg: 'success',
      data: { ok: true },
    })).toBe(true)
  })

  it('rejects non-envelope payloads', () => {
    expect(isApiEnvelope(null)).toBe(false)
    expect(isApiEnvelope({ code: 0, msg: 'success' })).toBe(false)
    expect(isApiEnvelope({ list: [], page: {} })).toBe(false)
  })
})
