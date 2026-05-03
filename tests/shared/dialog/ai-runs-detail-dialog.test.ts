import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('ai runs detail dialog layout', () => {
  it('uses fixed modal dimensions instead of mobile fullscreen', async () => {
    const { resolveAiRunsDetailDialogLayout } = await import('../../../src/views/Main/ai/runs/components/RunList/detail-dialog')

    expect(resolveAiRunsDetailDialogLayout(false)).toEqual({
      width: '800px',
      height: '620px',
    })

    expect(resolveAiRunsDetailDialogLayout(true)).toEqual({
      width: '94vw',
      height: '72vh',
    })
  })

  it('drops fullscreen usage from the ai runs detail dialog source', () => {
    const source = readFrontendSource('src/views/Main/ai/runs/components/RunList/index.vue')

    expect(source).not.toContain(':fullscreen=')
    expect(source).toContain('detailDialogLayout.height')
    expect(source).toContain('<AppDialog')
  })
})
