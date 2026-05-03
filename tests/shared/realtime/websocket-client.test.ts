import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const {
  extractClientId,
  shouldReconnect,
} = await import('../../../src/lib/realtime/websocket-client')

describe('websocket-client helpers', () => {
  it('extracts client id only from the standard nested data payload', () => {
    expect(extractClientId({ type: 'init', client_id: 'root-id', data: {} })).toBe('')
    expect(extractClientId({ type: 'init', data: { client_id: 'nested-id' } })).toBe('nested-id')
    expect(extractClientId({ type: 'init', data: {} })).toBe('')
  })

  it('reconnects only when attempts remain and active consumers still exist', () => {
    expect(shouldReconnect({ reconnectCount: 0, maxReconnectAttempts: 10, consumerCount: 1 })).toBe(true)
    expect(shouldReconnect({ reconnectCount: 10, maxReconnectAttempts: 10, consumerCount: 1 })).toBe(false)
    expect(shouldReconnect({ reconnectCount: 1, maxReconnectAttempts: 10, consumerCount: 0 })).toBe(false)
  })

  it('binds the legacy websocket endpoint through the legacy HTTP client', () => {
    const sourcePath = fileURLToPath(new URL('../../../src/lib/realtime/websocket-client.ts', import.meta.url))
    const source = readFileSync(sourcePath, 'utf8')

    expect(source).toContain("const { legacyRequest } = await import('@/lib/http')")
    expect(source).toContain("legacyRequest.post('/api/admin/WebSocket/bind'")
    expect(source).not.toContain("default: request")
  })
})
