import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readPermissionDialogSource() {
  return readFileSync(resolve('e:/admin/admin_front_ts/src/views/Main/permission/permission/components/PermissionDefinitionDialog.vue'), 'utf8')
}

describe('permission page parent selector contract', () => {
  it('keeps parent_id as single-select tree selector', () => {
    const source = readPermissionDialogSource()

    expect(source).toContain('<el-tree-select v-model="form.parent_id"')
    expect(source).not.toContain('show-checkbox')
  })

  it('keeps non-admin root buttons editable while rejecting root admin buttons', () => {
    const source = readPermissionDialogSource()

    expect(source).toContain('form.value.platform === PlatformEnum.ADMIN && form.value.type === PermissionTypeEnum.BUTTON')
    expect(source).toContain("t('permission.form.rule.parent_id')")
  })
})
