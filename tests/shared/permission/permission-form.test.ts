import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readPermissionPageSource() {
  return readFileSync(resolve('e:/admin/admin_front_ts/src/views/Main/permission/permission/index.vue'), 'utf8')
}

describe('permission page parent selector contract', () => {
  it('keeps parent_id as single-select tree selector', () => {
    const source = readPermissionPageSource()

    expect(source).toContain('<el-tree-select v-model="form.parent_id"')
    expect(source).not.toContain('show-checkbox')
  })
})
