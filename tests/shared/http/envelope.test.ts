import { describe, expect, it } from 'vitest'

const { isApiEnvelope, requireApiMessage } = await import('../../../src/lib/http/envelope')

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

  it('requires backend envelopes to carry an explicit non-empty msg', () => {
    expect(requireApiMessage({ code: 100, msg: '权限不足', data: null })).toBe('权限不足')
    expect(() => requireApiMessage({ code: 100, msg: '', data: null })).toThrow('api envelope msg must be a non-empty string')
    expect(() => requireApiMessage({ code: 100, msg: '   ', data: null })).toThrow('api envelope msg must be a non-empty string')
  })
})
