import { describe, expect, it } from 'vitest'
import { buildWebSocketURL } from '@/lib/realtime/websocket-client'
import { isLoopbackHost } from '@/lib/network/loopback'

describe('buildWebSocketURL', () => {
  it('keeps explicit non-loopback websocket URL unchanged', () => {
    expect(buildWebSocketURL({
      explicitURL: 'wss://zgm2003.cn/api/admin/v1/realtime/ws',
      currentHostname: '127.0.0.1',
    })).toBe('wss://zgm2003.cn/api/admin/v1/realtime/ws')
  })

  it('normalizes explicit loopback websocket host to current browser host', () => {
    expect(buildWebSocketURL({
      explicitURL: 'ws://localhost:8080/api/admin/v1/realtime/ws',
      currentHostname: '127.0.0.1',
    })).toBe('ws://127.0.0.1:8080/api/admin/v1/realtime/ws')
  })

  it('normalizes derived loopback websocket host from Go API base URL', () => {
    expect(buildWebSocketURL({
      apiBaseURL: 'http://localhost:8080',
      currentHostname: '127.0.0.1',
    })).toBe('ws://127.0.0.1:8080/api/admin/v1/realtime/ws')
  })

  it('derives wss protocol from https API base URL', () => {
    expect(buildWebSocketURL({
      apiBaseURL: 'https://www.zgm2003.cn',
      currentHostname: '127.0.0.1',
    })).toBe('wss://www.zgm2003.cn/api/admin/v1/realtime/ws')
  })
})

describe('isLoopbackHost', () => {
  it('detects loopback hosts only', () => {
    expect(isLoopbackHost('localhost')).toBe(true)
    expect(isLoopbackHost('127.0.0.1')).toBe(true)
    expect(isLoopbackHost('zgm2003.cn')).toBe(false)
  })
})
