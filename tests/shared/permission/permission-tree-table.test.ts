import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readPermissionTreeTableSource() {
  return readFileSync(
    resolve(process.cwd(), 'src/views/Main/permission/permission/components/PermissionTreeTable.vue'),
    'utf8',
  )
}

describe('permission tree table row interactions', () => {
  it('does not let status switch clicks bubble into row selection', () => {
    const source = readPermissionTreeTableSource()
    const switchStart = source.indexOf('<el-switch')
    const switchEnd = source.indexOf('/>', switchStart)
    const switchMarkup = source.slice(switchStart, switchEnd)

    expect(switchStart).toBeGreaterThan(-1)
    expect(switchMarkup).toContain('@click.stop')
  })
})
