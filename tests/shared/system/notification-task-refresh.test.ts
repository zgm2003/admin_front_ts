import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('notification task table refresh', () => {
  it('refreshes both list and status-count from the toolbar refresh button', () => {
    const source = readFrontendSource('src/views/Main/system/notificationTask/index.vue')

    expect(source).toContain('const handleRefresh = async () => {')
    expect(source).toContain('await getList()')
    expect(source).toContain('await refreshStatusCount()')
    expect(source).toContain('@refresh="handleRefresh"')
    expect(source).not.toContain('@refresh="refresh"')
  })
})
