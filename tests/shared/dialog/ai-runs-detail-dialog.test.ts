import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('ai runs detail dialog layout', () => {
  it('uses fixed modal dimensions instead of mobile fullscreen', async () => {
    const { resolveAiRunsDetailDialogLayout } = await import('../../../src/views/Main/ai/runs/components/RunList/detail-dialog')

    expect(resolveAiRunsDetailDialogLayout(false)).toEqual({
      width: '800px',
      top: '10vh',
      height: '620px',
    })

    expect(resolveAiRunsDetailDialogLayout(true)).toEqual({
      width: '94vw',
      top: '4vh',
      height: '72vh',
    })
  })

  it('drops fullscreen usage from the ai runs detail dialog source', () => {
    const source = readFileSync(
      resolve('e:/admin/admin_front_ts/src/views/Main/ai/runs/components/RunList/index.vue'),
      'utf8',
    )

    expect(source).not.toContain(':fullscreen=')
    expect(source).toContain('detailDialogLayout.height')
    expect(source).toContain('<AppDialog')
  })
})
