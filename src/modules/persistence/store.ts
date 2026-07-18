import type { Codec } from './codec'
import type { Namespace } from './namespaces'

export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  keys(): readonly string[]
}

export type PersistenceErrorKind = 'invalid-key' | 'oversized' | 'quota' | 'storage'

export class PersistenceError extends Error {
  readonly kind: PersistenceErrorKind
  readonly key: string
  readonly cause: unknown

  constructor(kind: PersistenceErrorKind, key: string, message: string, cause?: unknown) {
    super(message)
    this.name = 'PersistenceError'
    this.kind = kind
    this.key = key
    this.cause = cause
  }
}

interface StoredEnvelope {
  readonly version: number
  readonly value: unknown
  readonly expiresAt?: number
}

export interface PersistenceOptions {
  readonly now?: () => number
}

export interface PersistenceWriteOptions {
  readonly ttlMs?: number
}

const encoder = new TextEncoder()

function byteLength(value: string): number {
  return encoder.encode(value).byteLength
}

function isStoredEnvelope(value: unknown): value is StoredEnvelope {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
  if (!keys.every((key) => key === 'version' || key === 'value' || key === 'expiresAt')) return false
  if (!Object.prototype.hasOwnProperty.call(record, 'version')
    || !Object.prototype.hasOwnProperty.call(record, 'value')) return false
  if (!Number.isSafeInteger(record.version) || Number(record.version) < 1) return false
  return record.expiresAt === undefined
    || (typeof record.expiresAt === 'number' && Number.isFinite(record.expiresAt))
}

function isQuotaError(error: unknown): boolean {
  return error instanceof Error && error.name === 'QuotaExceededError'
}

export class Persistence {
  private readonly storage: StorageAdapter
  private readonly now: () => number

  constructor(storage: StorageAdapter, options: PersistenceOptions = {}) {
    this.storage = storage
    this.now = options.now ?? Date.now
  }

  read<T>(namespace: Namespace, name: string, codec: Codec<T>): T | null {
    const key = this.key(namespace, name)
    let raw: string | null
    try {
      raw = this.storage.getItem(key)
    } catch (error) {
      throw new PersistenceError('storage', key, `failed to read persisted value ${key}`, error)
    }
    if (raw === null) return null
    if (byteLength(raw) > codec.maxBytes) {
      this.discard(key)
      return null
    }

    let envelope: StoredEnvelope
    try {
      const parsed: unknown = JSON.parse(raw)
      if (!isStoredEnvelope(parsed)) throw new TypeError('invalid persistence envelope')
      envelope = parsed
    } catch {
      this.discard(key)
      return null
    }

    if (envelope.expiresAt !== undefined && this.now() >= envelope.expiresAt) {
      this.discard(key)
      return null
    }

    if (envelope.version === codec.version) {
      try {
        return codec.decode(envelope.value)
      } catch {
        this.discard(key)
        return null
      }
    }

    if (!codec.migrate) {
      this.discard(key)
      return null
    }
    let migrated: T | null
    try {
      migrated = codec.migrate(envelope.version, envelope.value)
    } catch {
      migrated = null
    }
    if (migrated === null) {
      this.discard(key)
      return null
    }
    const encoded = this.encode(key, codec, migrated, envelope.expiresAt)
    if (encoded === null) {
      this.discard(key)
      return null
    }
    this.store(key, encoded)
    return migrated
  }

  write<T>(
    namespace: Namespace,
    name: string,
    codec: Codec<T>,
    value: T,
    options: PersistenceWriteOptions = {},
  ): void {
    const key = this.key(namespace, name)
    const validated = codec.decode(value)
    let expiresAt: number | undefined
    if (options.ttlMs !== undefined) {
      if (!Number.isFinite(options.ttlMs) || options.ttlMs < 0) {
        throw new TypeError('persistence ttlMs must be a finite non-negative number')
      }
      expiresAt = this.now() + options.ttlMs
    }
    const encoded = this.encode(key, codec, validated, expiresAt)
    if (encoded === null) {
      throw new PersistenceError('oversized', key, `persisted value exceeds ${codec.maxBytes} UTF-8 bytes`)
    }
    this.store(key, encoded)
  }

  remove(namespace: Namespace, name: string): void {
    this.discard(this.key(namespace, name))
  }

  clearNamespace(namespace: Namespace): void {
    const prefix = `${namespace}:`
    let keys: readonly string[]
    try {
      keys = this.storage.keys()
    } catch (error) {
      throw new PersistenceError('storage', namespace, `failed to list persisted namespace ${namespace}`, error)
    }
    for (const key of keys) {
      if (key.startsWith(prefix)) this.discard(key)
    }
  }

  private key(namespace: Namespace, name: string): string {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) {
      throw new PersistenceError('invalid-key', `${namespace}:${name}`, 'persistence key must be one safe segment')
    }
    return `${namespace}:${name}`
  }

  private encode<T>(key: string, codec: Codec<T>, value: T, expiresAt?: number): string | null {
    const envelope = expiresAt === undefined
      ? { version: codec.version, value }
      : { version: codec.version, value, expiresAt }
    let encoded: string
    try {
      encoded = JSON.stringify(envelope)
    } catch (error) {
      throw new PersistenceError('storage', key, `failed to serialize persisted value ${key}`, error)
    }
    return byteLength(encoded) <= codec.maxBytes ? encoded : null
  }

  private store(key: string, value: string): void {
    try {
      this.storage.setItem(key, value)
    } catch (error) {
      throw new PersistenceError(
        isQuotaError(error) ? 'quota' : 'storage',
        key,
        isQuotaError(error) ? `storage quota exceeded for ${key}` : `failed to persist value ${key}`,
        error,
      )
    }
  }

  private discard(key: string): void {
    try {
      this.storage.removeItem(key)
    } catch (error) {
      throw new PersistenceError('storage', key, `failed to discard persisted value ${key}`, error)
    }
  }
}
