import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const {
  buildIdentityTopics,
  buildWebSocketURL,
  shouldReconnect,
} = await import('../../../src/lib/realtime/websocket-client')

describe('websocket-client helpers', () => {
  it('builds the Go realtime WebSocket URL from the Go API base URL', () => {
    expect(buildWebSocketURL({ apiBaseURL: 'http://localhost:8080' })).toBe('ws://localhost:8080/api/admin/v1/realtime/ws')
    expect(buildWebSocketURL({ apiBaseURL: 'https://www.zgm2003.cn/base' })).toBe('wss://www.zgm2003.cn/api/admin/v1/realtime/ws')
  })

  it('uses an explicit websocket URL when configured', () => {
    expect(buildWebSocketURL({
      apiBaseURL: 'https://www.zgm2003.cn',
      explicitURL: 'wss://zgm2003.cn/api/admin/v1/realtime/ws',
    })).toBe('wss://zgm2003.cn/api/admin/v1/realtime/ws')
  })

  it('builds identity topics only from server connected payload', () => {
    expect(buildIdentityTopics({ user_id: 7, platform: 'admin' })).toEqual(['user:7', 'platform:admin'])
    expect(buildIdentityTopics({ user_id: 0, platform: '  ' })).toEqual([])
  })

  it('reconnects only when attempts remain and active consumers still exist', () => {
    expect(shouldReconnect({ reconnectCount: 0, maxReconnectAttempts: 10, consumerCount: 1 })).toBe(true)
    expect(shouldReconnect({ reconnectCount: 10, maxReconnectAttempts: 10, consumerCount: 1 })).toBe(false)
    expect(shouldReconnect({ reconnectCount: 1, maxReconnectAttempts: 10, consumerCount: 0 })).toBe(false)
  })

  it('does not call the legacy PHP websocket bind endpoint anymore', () => {
    const sourcePath = fileURLToPath(new URL('../../../src/lib/realtime/websocket-client.ts', import.meta.url))
    const source = readFileSync(sourcePath, 'utf8')

    expect(source).toContain('realtime.connected.v1')
    expect(source).toContain('realtime.subscribe.v1')
    expect(source).not.toContain("legacyRequest.post('/api/admin/WebSocket/bind'")
    expect(source).not.toContain("ws://127.0.0.1:7272")
  })
})
