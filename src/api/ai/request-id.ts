const REQUEST_ID_UNAVAILABLE = 'Web Crypto is required to create a paid AI request ID'

function formatUuidV4(bytes: Uint8Array): string {
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function createAiRequestId(): string {
  const webCrypto = globalThis.crypto
  if (!webCrypto) throw new Error(REQUEST_ID_UNAVAILABLE)
  if (typeof webCrypto.randomUUID === 'function') return webCrypto.randomUUID()
  if (typeof webCrypto.getRandomValues !== 'function') throw new Error(REQUEST_ID_UNAVAILABLE)

  return formatUuidV4(webCrypto.getRandomValues(new Uint8Array(16)))
}
