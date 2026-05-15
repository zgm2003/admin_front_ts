import { describe, expect, it } from 'vitest'
import { resolvePageLayout } from '../../../src/views/Layout/utils/page-layout'

describe('page layout resolver', () => {
  it('treats home as plain, normal pages as card, and error pages as centered', () => {
    expect(resolvePageLayout({ pageLayout: 'plain' })).toBe('plain')
    expect(resolvePageLayout({ pageLayout: 'centered' })).toBe('centered')
    expect(resolvePageLayout({})).toBe('card')
  })
})
