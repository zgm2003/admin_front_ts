import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Context profile dialog', () => {
  it('uses a backend-registered token counter by default', () => {
    const source = readFileSync(resolve(
      process.cwd(),
      'src/views/Main/ai/context/components/ContextProfileDialog.vue',
    ), 'utf8')

    expect(source).toContain("embedding_token_counter_id: 'utf8_bytes_v1'")
    expect(source).not.toContain("embedding_token_counter_id: 'cl100k_base'")
  })
})
