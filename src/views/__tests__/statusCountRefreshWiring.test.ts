import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const read = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), 'utf-8')

describe('status-count pages wire delete refresh', () => {
  it('export task refreshes status count after delete', () => {
    const source = read('../Main/system/exportTask/index.vue')

    expect(source).toContain('afterDel: refreshStatusCount')
  })

  it('notification task refreshes status count after delete', () => {
    const source = read('../Main/system/notificationTask/index.vue')

    expect(source).toContain('afterDel: refreshStatusCount')
  })

  it('goods refreshes status count after delete', () => {
    const source = read('../Main/ai/goods/index.vue')

    expect(source).toContain('afterDel: refreshStatusCount')
  })
})
