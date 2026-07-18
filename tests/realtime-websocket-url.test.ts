import { describe, expect, it } from 'vitest'
import { buildWebSocketURL } from '@/lib/realtime/websocket-client'
import { isLoopbackHost } from '@/lib/network/loopback'

describe('buildWebSocketURL', () => {
  it('keeps explicit non-loopback websocket URL unchanged', () => {
    expect(buildWebSocketURL({
      explicitURL: 'wss://www.zgm2003.cn/api/admin/v1/realtime/ws',
      currentHostname: '127.0.0.1',
      ticket: 'prod-ticket',
    })).toBe('wss://www.zgm2003.cn/api/admin/v1/realtime/ws?ticket=prod-ticket')
  })

  it('normalizes explicit loopback websocket host to current browser host', () => {
    expect(buildWebSocketURL({
      explicitURL: 'ws://localhost:8080/api/admin/v1/realtime/ws',
      currentHostname: '127.0.0.1',
      ticket: 'local-ticket',
    })).toBe('ws://127.0.0.1:8080/api/admin/v1/realtime/ws?ticket=local-ticket')
  })

  it('normalizes derived loopback websocket host from Go API base URL', () => {
    expect(buildWebSocketURL({
      apiBaseURL: 'http://localhost:8080',
      currentHostname: '127.0.0.1',
      ticket: 'derived-ticket',
    })).toBe('ws://127.0.0.1:8080/api/admin/v1/realtime/ws?ticket=derived-ticket')
  })

  it('derives wss protocol from https API base URL', () => {
    expect(buildWebSocketURL({
      apiBaseURL: 'https://www.zgm2003.cn',
      currentHostname: '127.0.0.1',
      ticket: 'secure-ticket',
    })).toBe('wss://www.zgm2003.cn/api/admin/v1/realtime/ws?ticket=secure-ticket')
  })
})

describe('isLoopbackHost', () => {
  it('detects loopback hosts only', () => {
    expect(isLoopbackHost('localhost')).toBe(true)
    expect(isLoopbackHost('127.0.0.1')).toBe(true)
    expect(isLoopbackHost('www.zgm2003.cn')).toBe(false)
  })
})
