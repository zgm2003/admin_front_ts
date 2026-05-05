const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname)
}

function getCurrentHostname(): string {
  if (typeof window === 'undefined') {
    return ''
  }
  return window.location.hostname
}

export function normalizeLoopbackURLHost<T extends URL>(targetURL: T, currentHostname = getCurrentHostname()): T {
  if (!currentHostname) {
    return targetURL
  }
  if (isLoopbackHost(targetURL.hostname) && isLoopbackHost(currentHostname)) {
    targetURL.hostname = currentHostname
  }

  return targetURL
}
