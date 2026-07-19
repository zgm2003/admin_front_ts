import { z } from 'zod'

export interface ContractSchema {
  readonly $ref?: string
  readonly type?: string | readonly string[]
  readonly const?: unknown
  readonly enum?: readonly unknown[]
  readonly anyOf?: readonly ContractSchema[]
  readonly oneOf?: readonly ContractSchema[]
  readonly properties?: Readonly<Record<string, ContractSchema>>
  readonly required?: readonly string[]
  readonly additionalProperties?: boolean | ContractSchema
  readonly items?: ContractSchema
  readonly minimum?: number
  readonly maximum?: number
  readonly minLength?: number
  readonly maxLength?: number
  readonly pattern?: string
  readonly minItems?: number
  readonly maxItems?: number
  readonly description?: string
  readonly format?: string
  readonly default?: unknown
}

export interface ContractSchemaCompiler {
  compile<T>(schema: ContractSchema): z.ZodType<T>
}

const componentPrefix = '#/components/schemas/'

function invalidSchema(message: string): never {
  throw new TypeError(`Invalid generated contract schema: ${message}`)
}

function literalSchema(value: unknown): z.ZodType<unknown> {
  if (value === null) return z.null()
  if (typeof value === 'string') return z.literal(value)
  if (typeof value === 'number') return z.literal(value)
  if (typeof value === 'boolean') return z.literal(value)
  return invalidSchema(`unsupported literal ${String(value)}`)
}

function unionSchemas(schemas: readonly z.ZodType<unknown>[]): z.ZodType<unknown> {
  const [first, ...rest] = schemas
  if (!first) return invalidSchema('union must contain at least one schema')
  return rest.reduce<z.ZodType<unknown>>((result, schema) => result.or(schema), first)
}

export function createContractSchemaCompiler(
  components: Readonly<Record<string, ContractSchema>>,
): ContractSchemaCompiler {
  const componentCache = new Map<string, z.ZodType<unknown>>()

  function componentSchema(reference: string): z.ZodType<unknown> {
    if (!reference.startsWith(componentPrefix)) {
      return invalidSchema(`unsupported reference ${reference}`)
    }
    const name = reference.slice(componentPrefix.length)
    const source = components[name]
    if (!source) return invalidSchema(`missing component ${name}`)
    const cached = componentCache.get(name)
    if (cached) return cached

    let resolved: z.ZodType<unknown> | undefined
    const lazy = z.lazy(() => {
      resolved ??= compileUnknown(source)
      return resolved
    })
    componentCache.set(name, lazy)
    resolved = compileUnknown(source)
    return lazy
  }

  function compileObject(schema: ContractSchema): z.ZodType<unknown> {
    const required = new Set(schema.required ?? [])
    const shape: Record<string, z.ZodType<unknown>> = {}
    for (const [name, property] of Object.entries(schema.properties ?? {})) {
      const compiled = compileUnknown(property)
      shape[name] = required.has(name) ? compiled : compiled.optional()
    }

    let object = z.object(shape)
    if (schema.additionalProperties === false) return object.strict()
    if (typeof schema.additionalProperties === 'object') {
      return object.catchall(compileUnknown(schema.additionalProperties))
    }
    object = object.passthrough()
    return object
  }

  function compileArray(schema: ContractSchema): z.ZodType<unknown> {
    let array = z.array(schema.items ? compileUnknown(schema.items) : z.unknown())
    if (schema.minItems !== undefined) array = array.min(schema.minItems)
    if (schema.maxItems !== undefined) array = array.max(schema.maxItems)
    return array
  }

  function compileString(schema: ContractSchema): z.ZodType<unknown> {
    let value = z.string()
    if (schema.minLength !== undefined) value = value.min(schema.minLength)
    if (schema.maxLength !== undefined) value = value.max(schema.maxLength)
    if (schema.pattern !== undefined) value = value.regex(new RegExp(schema.pattern))
    return value
  }

  function compileNumber(schema: ContractSchema, integer: boolean): z.ZodType<unknown> {
    let value = integer ? z.number().int() : z.number()
    if (schema.minimum !== undefined) value = value.min(schema.minimum)
    if (schema.maximum !== undefined) value = value.max(schema.maximum)
    return value
  }

  function compileType(schema: ContractSchema, type: string): z.ZodType<unknown> {
    switch (type) {
      case 'object': return compileObject(schema)
      case 'array': return compileArray(schema)
      case 'string': return compileString(schema)
      case 'integer': return compileNumber(schema, true)
      case 'number': return compileNumber(schema, false)
      case 'boolean': return z.boolean()
      case 'null': return z.null()
      default: return invalidSchema(`unsupported type ${type}`)
    }
  }

  function compileUnknown(schema: ContractSchema): z.ZodType<unknown> {
    if (schema.$ref) return componentSchema(schema.$ref)
    if (Object.prototype.hasOwnProperty.call(schema, 'const')) return literalSchema(schema.const)
    if (schema.enum) return unionSchemas(schema.enum.map(literalSchema))
    if (schema.anyOf) return unionSchemas(schema.anyOf.map(compileUnknown))
    if (schema.oneOf) return unionSchemas(schema.oneOf.map(compileUnknown))
    if (Array.isArray(schema.type)) {
      return unionSchemas(schema.type.map((type) => compileType(schema, type)))
    }
    if (typeof schema.type === 'string') return compileType(schema, schema.type)
    if (schema.properties) return compileObject(schema)
    return z.unknown()
  }

  return {
    compile<T>(schema: ContractSchema): z.ZodType<T> {
      return compileUnknown(schema) as z.ZodType<T>
    },
  }
}
