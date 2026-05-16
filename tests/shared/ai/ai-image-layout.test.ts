import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('AI image playground layout', () => {
  it('lets the outer page card grow when the playground switches to stacked layout', () => {
    const page = read('src/views/Main/ai/image-playground/index.vue')

    expect(page).toContain('@media (max-width: 1360px)')
    expect(page).toContain('.layout-view.page-card:has(.ai-image-page)')
    expect(page).toMatch(/height:\s*auto;[\s\S]*min-height:\s*100%;[\s\S]*overflow:\s*visible;/)
  })
})
