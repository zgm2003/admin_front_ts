import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('goods dialog layout', () => {
  it('uses fixed modal layouts for workbench and detail dialogs', async () => {
    const {
      resolveGoodsDetailDialogLayout,
      resolveGoodsWorkbenchDialogLayout,
    } = await import('../../../src/views/Main/ai/goods/dialog-layout')

    expect(resolveGoodsWorkbenchDialogLayout(false)).toEqual({
      width: '1280px',
      height: '78vh',
    })
    expect(resolveGoodsWorkbenchDialogLayout(true)).toEqual({
      width: '94vw',
      height: '82vh',
    })

    expect(resolveGoodsDetailDialogLayout(false)).toEqual({
      width: '750px',
      height: '70vh',
    })
    expect(resolveGoodsDetailDialogLayout(true)).toEqual({
      width: '94vw',
      height: '72vh',
    })
  })

  it('drops fullscreen usage from goods dialogs source', () => {
    const source = readFrontendSource('src/views/Main/ai/goods/index.vue')

    expect(source).not.toContain('fullscreen destroy-on-close')
    expect(source).not.toContain(':fullscreen=')
    expect(source).toContain('workbenchDialogLayout.height')
    expect(source).toContain('detailDialogLayout.height')
    expect(source).toContain('<AppDialog')
  })
})
