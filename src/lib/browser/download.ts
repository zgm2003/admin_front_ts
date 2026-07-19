const defaultFilename = 'download'
const externalDownloadHosts = new Set(['www.zgm2003.cn', 'cos.zgm2003.cn'])

function parseDownloadUrl(input: string): URL {
  const base = new URL(globalThis.location.href)
  let url: URL
  try {
    url = new URL(input, base)
  } catch {
    throw new Error('download URL is invalid')
  }
  if (url.username || url.password) throw new Error('download URL credentials are forbidden')
  const sameOrigin = url.origin === base.origin
  const allowlistedHttps = url.protocol === 'https:'
    && url.port === ''
    && externalDownloadHosts.has(url.hostname.toLowerCase())
  if (!sameOrigin && !allowlistedHttps) throw new Error('download URL is not allowlisted')
  return url
}

export function deriveDownloadFilename(input: string, filename?: string): string {
  const explicit = filename?.trim()
  if (explicit) return explicit
  const url = parseDownloadUrl(input)
  const basename = url.pathname.split('/').pop()?.trim()
  if (!basename) return defaultFilename
  try {
    return decodeURIComponent(basename) || defaultFilename
  } catch {
    return basename
  }
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) throw new TypeError('file size must be a non-negative number')
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const
  const unitIndex = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / (1024 ** unitIndex)).toFixed(2)} ${units[unitIndex]}`
}

export async function downloadFile(input: string, filename?: string): Promise<void> {
  const url = parseDownloadUrl(input)
  const response = await globalThis.fetch(url.href, { credentials: 'same-origin' })
  if (!response.ok) throw new Error(`download failed with HTTP ${response.status}`)

  const blobUrl = URL.createObjectURL(await response.blob())
  let anchor: HTMLAnchorElement | undefined
  try {
    anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = deriveDownloadFilename(url.href, filename)
    document.body.appendChild(anchor)
    anchor.click()
  } finally {
    anchor?.remove()
    URL.revokeObjectURL(blobUrl)
  }
}
