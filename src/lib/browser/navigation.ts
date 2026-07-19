const externalHosts = new Set(['www.zgm2003.cn', 'cos.zgm2003.cn'])
const maxUrlLength = 4_096

function parseAbsoluteUrl(input: string): URL {
  if (input.length === 0 || input.length > maxUrlLength) throw new Error('URL is invalid')
  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new Error('URL must be absolute')
  }
  if (url.username || url.password) throw new Error('URL credentials are forbidden')
  return url
}

function openIsolated(url: URL): void {
  if (typeof globalThis.open !== 'function') throw new Error('window.open is unavailable')
  const opened = globalThis.open(url.href, '_blank', 'noopener,noreferrer')
  if (!opened) return
  try {
    opened.opener = null
  } catch {
    // noopener already isolates browsers that expose a read-only opener.
  }
}

export function openExternalUrl(input: string): void {
  const url = parseAbsoluteUrl(input)
  if (url.protocol !== 'https:' || url.port !== '' || !externalHosts.has(url.hostname.toLowerCase())) {
    throw new Error('external URL is not allowlisted')
  }
  openIsolated(url)
}

export function openSameOriginPath(input: string): void {
  if (input.length === 0 || input.length > maxUrlLength) throw new Error('same-origin path is invalid')
  const base = new URL(globalThis.location.href)
  let url: URL
  try {
    url = new URL(input, base)
  } catch {
    throw new Error('same-origin path is invalid')
  }
  if (url.username || url.password) throw new Error('URL credentials are forbidden')
  if (url.origin !== base.origin) throw new Error('URL must remain on the current origin')
  openIsolated(url)
}

export function navigateToExternalHttps(input: string): void {
  const url = parseAbsoluteUrl(input)
  if (url.protocol !== 'https:') throw new Error('external navigation requires HTTPS')
  globalThis.location.assign(url.href)
}
