import { describe, expect, it } from 'vitest'
import { createContractSchemaCompiler } from '@/modules/http/contract-schema'

describe('contract schema compiler', () => {
  it('enforces JSON Schema uniqueItems using structural equality', () => {
    const schema = createContractSchemaCompiler({}).compile<unknown[]>({
      type: 'array',
      uniqueItems: true,
      items: { type: 'object', additionalProperties: true },
    })

    expect(schema.safeParse([{ id: 1 }, { id: 2 }]).success).toBe(true)
    expect(schema.safeParse([{ id: 1, name: 'same' }, { name: 'same', id: 1 }]).success).toBe(false)
  })
})
