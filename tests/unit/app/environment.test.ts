import { describe, expect, it } from 'vitest'
import { parseEnvironment } from '@/app/environment'

function environment(overrides: Record<string, string | boolean | undefined> = {}) {
  return {
    MODE: 'development',
    DEV: true,
    PROD: false,
    SSR: false,
    VITE_PLATFORM: 'admin',
    VITE_GO_API_BASE_URL: 'http://localhost:5173',
    VITE_WEB_SOCKET_URL: 'ws://localhost:5173/api/admin/v1/realtime/ws',
    ...overrides,
  } as ImportMetaEnv
}

const location = { href: 'http://localhost:5173/login' } as Location

describe('parseEnvironment', () => {
  it('parses the closed Admin browser environment without user-agent inference', () => {
    const parsed = parseEnvironment(environment(), location)

    expect(parsed.mode).toBe('development')
    expect(parsed.platform).toBe('admin')
    expect(parsed.apiOrigin.href).toBe('http://localhost:5173/')
    expect(parsed.realtimeOrigin.href).toBe('ws://localhost:5173/api/admin/v1/realtime/ws')
    expect(Object.keys(parsed).sort()).toEqual(['apiOrigin', 'mode', 'platform', 'realtimeOrigin'])
  })

  it('uses an explicit local-Docker runtime mode instead of inferring from the build command', () => {
    const parsed = parseEnvironment(environment({
      MODE: 'production',
      DEV: false,
      PROD: true,
      VITE_ADMIN_RUNTIME_MODE: 'development',
    }), location)

    expect(parsed.mode).toBe('development')
    expect(parsed.apiOrigin.href).toBe('http://localhost:5173/')
  })

  it('normalizes development loopback endpoints to the browser host', () => {
    const parsed = parseEnvironment(environment(), {
      href: 'http://admin.internal.test:5173/login',
    } as Location)

    expect(parsed.apiOrigin.hostname).toBe('admin.internal.test')
    expect(parsed.realtimeOrigin.hostname).toBe('admin.internal.test')
  })

  it('normalizes localhost endpoints to a 127.0.0.1 browser host', () => {
    const parsed = parseEnvironment(environment(), {
      href: 'http://127.0.0.1:5173/home',
    } as Location)

    expect(parsed.apiOrigin.hostname).toBe('127.0.0.1')
    expect(parsed.realtimeOrigin.hostname).toBe('127.0.0.1')
  })

  it.each([
    [{ MODE: undefined }, /MODE is required/],
    [{ VITE_PLATFORM: '   ' }, /VITE_PLATFORM is required/],
    [{ VITE_GO_API_BASE_URL: 'ftp://admin.example.test' }, /HTTP or HTTPS/],
    [{ VITE_GO_API_BASE_URL: 'http://localhost:5173/base' }, /origin without a path/],
    [{ VITE_WEB_SOCKET_URL: 'https://localhost:5173/realtime' }, /WS or WSS/],
  ])('rejects missing or protocol-invalid environment input: %o', (overrides, message) => {
    expect(() => parseEnvironment(environment(overrides), location)).toThrow(message)
  })

  it('accepts matching explicit production ports', () => {
    const parsed = parseEnvironment(environment({
      MODE: 'production',
      DEV: false,
      PROD: true,
      VITE_GO_API_BASE_URL: 'https://admin.example.test:8443',
      VITE_WEB_SOCKET_URL: 'wss://admin.example.test:8443/api/admin/v1/realtime/ws',
    }), { href: 'https://admin.example.test:8443/' } as Location)

    expect(parsed.apiOrigin.port).toBe('8443')
    expect(parsed.realtimeOrigin.port).toBe('8443')
  })

  it.each([
    [{ VITE_PLATFORM: 'app' }, /VITE_PLATFORM/],
    [{ VITE_ADMIN_RUNTIME_MODE: 'staging' }, /VITE_ADMIN_RUNTIME_MODE/],
    [{ VITE_GO_API_BASE_URL: 'not-a-url' }, /VITE_GO_API_BASE_URL/],
    [{ VITE_WEB_SOCKET_URL: 'not-a-url' }, /VITE_WEB_SOCKET_URL/],
  ])('rejects values outside the closed Admin environment: %o', (overrides, message) => {
    expect(() => parseEnvironment(environment(overrides), location)).toThrow(message)
  })

  it.each([
    [{ VITE_GO_API_BASE_URL: 'http://admin.example.test' }, /HTTPS/],
    [{ VITE_WEB_SOCKET_URL: 'ws://admin.example.test/api/admin/v1/realtime/ws' }, /WSS/],
    [{ VITE_GO_API_BASE_URL: 'https://localhost' }, /loopback/],
    [{ VITE_WEB_SOCKET_URL: 'wss://127.0.0.1/api/admin/v1/realtime/ws' }, /loopback/],
    [{ VITE_GO_API_BASE_URL: 'https://admin.example.test', VITE_WEB_SOCKET_URL: 'wss://ws.example.test/api/admin/v1/realtime/ws' }, /same host/],
    [{ VITE_GO_API_BASE_URL: 'https://user:secret@admin.example.test' }, /credentials/],
    [{ VITE_GO_API_BASE_URL: 'https://admin.example.test?token=secret' }, /query/],
    [{ VITE_WEB_SOCKET_URL: 'wss://admin.example.test/api/admin/v1/realtime/ws#secret' }, /fragment/],
  ])('fails closed for an unsafe production origin: %o', (overrides, message) => {
    const production = environment({
      MODE: 'production',
      DEV: false,
      PROD: true,
      VITE_GO_API_BASE_URL: 'https://admin.example.test',
      VITE_WEB_SOCKET_URL: 'wss://admin.example.test/api/admin/v1/realtime/ws',
      ...overrides,
    })

    expect(() => parseEnvironment(production, { href: 'https://admin.example.test/' } as Location))
      .toThrow(message)
  })
})
