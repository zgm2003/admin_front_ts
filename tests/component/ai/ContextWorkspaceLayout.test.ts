import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Context workspace layout', () => {
  it('keeps workspace content inside the page card', () => {
    const source = readFileSync(resolve(
      process.cwd(),
      'src/views/Main/ai/context/index.vue',
    ), 'utf8')

    expect(source).toMatch(/\.context-workspace\s*\{[^}]*height:\s*100%;/s)
    expect(source).toMatch(/\.context-workspace\s*\{[^}]*min-height:\s*0;/s)
    expect(source).toMatch(/\.context-workspace\s*\{[^}]*overflow:\s*auto;/s)
    expect(source).not.toContain('background: var(--el-bg-color-page)')
  })
})
