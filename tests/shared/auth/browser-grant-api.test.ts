import { describe, expect, it } from 'vitest'

describe('browser grant API contract', () => {
  it('accepts only the exact documented ticket and grant response shapes', async () => {
    const {
      parseQueueMonitorGrantResponse,
      parseRealtimeTicketResponse,
    } = await import('../../../src/api/auth/browserGrantContract')

    expect(parseRealtimeTicketResponse({ ticket: 'opaque-ticket', expires_in: 30 })).toEqual({
      ticket: 'opaque-ticket',
      expires_in: 30,
    })
    expect(parseQueueMonitorGrantResponse({ expires_in: 60 })).toEqual({ expires_in: 60 })

    expect(() => parseRealtimeTicketResponse({ expires_in: 30 })).toThrow('realtime ticket response violates contract')
    expect(() => parseRealtimeTicketResponse({ ticket: 'opaque-ticket', expires_in: 30, legacy_token: 'no' })).toThrow('realtime ticket response violates contract')
    expect(() => parseQueueMonitorGrantResponse({ expires_in: 30 })).toThrow('queue monitor grant response violates contract')
  })
})
