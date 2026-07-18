import type { ZodType } from 'zod'

export interface Codec<T> {
  readonly version: number
  readonly maxBytes: number
  decode(value: unknown): T
  safeDecode(value: unknown): T
  migrate?(version: number, value: unknown): T | null
}

export interface CodecDefinition<T> {
  readonly version: number
  readonly maxBytes: number
  readonly schema: ZodType<T>
  readonly migrate?: (version: number, value: unknown) => unknown | null
}

export function defineCodec<T>(definition: CodecDefinition<T>): Codec<T> {
  if (!Number.isSafeInteger(definition.version) || definition.version < 1) {
    throw new TypeError('codec version must be a positive safe integer')
  }
  if (!Number.isSafeInteger(definition.maxBytes) || definition.maxBytes < 1) {
    throw new TypeError('codec maxBytes must be a positive safe integer')
  }

  const decode = (value: unknown) => definition.schema.parse(value)
  const codec: Codec<T> = {
    version: definition.version,
    maxBytes: definition.maxBytes,
    decode,
    safeDecode: decode,
  }
  if (definition.migrate) {
    codec.migrate = (version, value) => {
      const migrated = definition.migrate?.(version, value)
      return migrated === null ? null : decode(migrated)
    }
  }
  return Object.freeze(codec)
}
