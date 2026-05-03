import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('search dialog layout', () => {
  it('uses fixed modal dimensions instead of mobile fullscreen', async () => {
    const { resolveSearchDialogLayout } = await import('../../../src/views/Layout/components/Header/components/search-dialog')

    expect(resolveSearchDialogLayout(false)).toEqual({
      width: '700px',
      bodyHeight: '620px',
      resultHeight: '400px',
    })

    expect(resolveSearchDialogLayout(true)).toEqual({
      width: '94vw',
      bodyHeight: '72vh',
      resultHeight: '48vh',
    })
  })

  it('drops fullscreen usage from the search dialog source', () => {
    const source = readFrontendSource('src/views/Layout/components/Header/components/SearchDialog.vue')

    expect(source).not.toContain(':fullscreen=')
    expect(source).toContain('<AppDialog')
    expect(source).toContain('body-padding="0"')
    expect(source).toContain('dialogLayout.bodyHeight')
    expect(source).toContain('dialogLayout.resultHeight')
  })
})
