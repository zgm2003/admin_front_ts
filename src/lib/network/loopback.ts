const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname)
}

export function normalizeLoopbackURLHost<T extends URL>(targetURL: T, currentHostname = window.location.hostname): T {
  if (isLoopbackHost(targetURL.hostname) && isLoopbackHost(currentHostname)) {
    targetURL.hostname = currentHostname
  }

  return targetURL
}
