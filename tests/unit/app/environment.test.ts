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
    expect(parsed.clientVariant).toBe('browser')
    expect(parsed.apiOrigin.href).toBe('http://localhost:5173/')
    expect(parsed.realtimeOrigin.href).toBe('ws://localhost:5173/api/admin/v1/realtime/ws')
  })

  it('accepts only an explicit packaged-desktop client variant', () => {
    const parsed = parseEnvironment(environment({ VITE_ADMIN_CLIENT_VARIANT: 'desktop' }), location)

    expect(parsed.clientVariant).toBe('desktop')
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

  it.each([
    [{ VITE_PLATFORM: 'app' }, /VITE_PLATFORM/],
    [{ VITE_ADMIN_CLIENT_VARIANT: 'mobile' }, /VITE_ADMIN_CLIENT_VARIANT/],
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
