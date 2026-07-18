export interface AppEnvironment {
  readonly mode: 'development' | 'production' | 'test'
  readonly platform: 'admin'
  readonly apiOrigin: URL
  readonly realtimeOrigin: URL
  readonly clientVariant: 'browser' | 'desktop'
}

const loopbackNames = new Set(['localhost', '0.0.0.0', '::1', '[::1]'])

function requiredString(input: ImportMetaEnv, name: string): string {
  const value = input[name]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${name} is required`)
  }
  return value.trim()
}

function parseAbsoluteUrl(input: ImportMetaEnv, name: string): URL {
  const value = requiredString(input, name)
  try {
    return new URL(value)
  } catch {
    throw new Error(`${name} must be an absolute URL`)
  }
}

function isLoopback(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  return loopbackNames.has(normalized) || /^127(?:\.\d{1,3}){3}$/.test(normalized)
}

function assertNoSensitiveUrlParts(url: URL, name: string) {
  if (url.username || url.password) {
    throw new Error(`${name} must not contain credentials`)
  }
  if (url.search) {
    throw new Error(`${name} must not contain a query`)
  }
  if (url.hash) {
    throw new Error(`${name} must not contain a fragment`)
  }
}

function effectivePort(url: URL): string {
  if (url.port) return url.port
  return url.protocol === 'https:' || url.protocol === 'wss:' ? '443' : '80'
}

function normalizeDevelopmentLoopback(url: URL, location: Location): URL {
  if (!isLoopback(url.hostname)) return url
  const locationUrl = new URL(location.href)
  if (!locationUrl.hostname || isLoopback(locationUrl.hostname)) return url
  const normalized = new URL(url.href)
  normalized.hostname = locationUrl.hostname
  return normalized
}

export function parseEnvironment(input: ImportMetaEnv, location: Location): AppEnvironment {
  const buildMode = requiredString(input, 'MODE')
  const mode = input.VITE_ADMIN_RUNTIME_MODE ?? buildMode
  if (mode !== 'development' && mode !== 'production' && mode !== 'test') {
    throw new Error(`VITE_ADMIN_RUNTIME_MODE must be development, production, or test; received ${mode}`)
  }
  if (requiredString(input, 'VITE_PLATFORM') !== 'admin') {
    throw new Error('VITE_PLATFORM must be admin')
  }

  const rawClientVariant = input.VITE_ADMIN_CLIENT_VARIANT ?? 'browser'
  if (rawClientVariant !== 'browser' && rawClientVariant !== 'desktop') {
    throw new Error('VITE_ADMIN_CLIENT_VARIANT must be browser or desktop')
  }

  let apiOrigin = parseAbsoluteUrl(input, 'VITE_GO_API_BASE_URL')
  let realtimeOrigin = parseAbsoluteUrl(input, 'VITE_WEB_SOCKET_URL')
  if (mode !== 'production') {
    apiOrigin = normalizeDevelopmentLoopback(apiOrigin, location)
    realtimeOrigin = normalizeDevelopmentLoopback(realtimeOrigin, location)
  }

  assertNoSensitiveUrlParts(apiOrigin, 'VITE_GO_API_BASE_URL')
  assertNoSensitiveUrlParts(realtimeOrigin, 'VITE_WEB_SOCKET_URL')
  if (apiOrigin.protocol !== 'http:' && apiOrigin.protocol !== 'https:') {
    throw new Error('VITE_GO_API_BASE_URL must use HTTP or HTTPS')
  }
  if (apiOrigin.pathname !== '/') {
    throw new Error('VITE_GO_API_BASE_URL must be an origin without a path')
  }
  if (realtimeOrigin.protocol !== 'ws:' && realtimeOrigin.protocol !== 'wss:') {
    throw new Error('VITE_WEB_SOCKET_URL must use WS or WSS')
  }

  if (mode === 'production') {
    if (apiOrigin.protocol !== 'https:') {
      throw new Error('production Admin API origin must use HTTPS')
    }
    if (realtimeOrigin.protocol !== 'wss:') {
      throw new Error('production Admin realtime origin must use WSS')
    }
    if (isLoopback(apiOrigin.hostname) || isLoopback(realtimeOrigin.hostname)) {
      throw new Error('production Admin origins must not use a loopback host')
    }
    if (apiOrigin.hostname !== realtimeOrigin.hostname || effectivePort(apiOrigin) !== effectivePort(realtimeOrigin)) {
      throw new Error('Admin API and realtime origins must use the same host and effective port')
    }
  }

  return {
    mode,
    platform: 'admin',
    apiOrigin,
    realtimeOrigin,
    clientVariant: rawClientVariant,
  }
}
