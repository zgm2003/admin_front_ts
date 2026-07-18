import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('browser grant API contract', () => {
  it('uses only the documented P04 grant endpoints and exact response fields', () => {
    const sourcePath = resolve(process.cwd(), 'src/api/auth/browserGrant.ts')
    expect(existsSync(sourcePath)).toBe(true)
    if (!existsSync(sourcePath)) {
      return
    }

    const source = readFileSync(sourcePath, 'utf8')
    expect(source).toContain("from './browserGrantContract'")
    expect(source).toContain("`${ADMIN_API_PREFIX}/auth/realtime-tickets`")
    expect(source).toContain("`${ADMIN_API_PREFIX}/auth/queue-monitor-grants`")
    expect(source).toContain('issueRealtimeTicket(signal?: AbortSignal)')
    expect(source).toContain('{ signal }')
    expect(source).not.toContain('queue-monitor-ui')
    expect(source).not.toContain('access_token')
  })

  it('accepts only the exact documented ticket and grant response shapes', async () => {
    const sourcePath = resolve(process.cwd(), 'src/api/auth/browserGrantContract.ts')
    expect(existsSync(sourcePath)).toBe(true)
    if (!existsSync(sourcePath)) {
      return
    }

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
