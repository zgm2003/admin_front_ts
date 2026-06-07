import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const displayDemoPath = 'src/views/Main/component/display/index.vue'

function source(path: string) {
  const absolutePath = join(process.cwd(), path)
  expect(existsSync(absolutePath)).toBe(true)
  return readFileSync(absolutePath, 'utf8')
}

describe('display demo source quality', () => {
  it('does not document passthrough table column props as any', () => {
    const text = source(displayDemoPath)

    expect(text).not.toContain("type: 'any'")
    expect(text).toContain("type: 'Record<string, unknown>'")
  })
})
