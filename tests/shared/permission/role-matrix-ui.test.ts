import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('role permission matrix UI contract', () => {
  it('uses matrix components instead of the old cascader permission editor', () => {
    const source = readFileSync(resolve('e:/admin/admin_front_ts/src/views/Main/permission/role/index.vue'), 'utf8')

    expect(source).toContain('RolePermissionMatrix')
    expect(source).toContain('RolePermissionDiffDialog')
    expect(source).toContain('buildRolePermissionMatrix')
    expect(source).toContain('getRoleMatrixGroupPermissionIds')
    expect(source).toContain('diffPermissionIds')
    expect(source).toContain('permission_platform_arr')
    expect(source).toContain('<el-tabs')
    expect(source).not.toContain('<el-cascader')
    expect(source).not.toContain('buildLeafSelectablePermissionTree')
  })

  it('keeps matrix and diff UI in focused child components', () => {
    const matrix = readFileSync(resolve('e:/admin/admin_front_ts/src/views/Main/permission/role/components/RolePermissionMatrix.vue'), 'utf8')
    const diff = readFileSync(resolve('e:/admin/admin_front_ts/src/views/Main/permission/role/components/RolePermissionDiffDialog.vue'), 'utf8')

    expect(matrix).toContain('defineModel<number[]>')
    expect(matrix).toContain('RoleMatrixGroup')
    expect(matrix).toContain('toggleMatrixGroup')
    expect(matrix).toContain('toggleMatrixPage')
    expect(matrix).toContain('toggleMatrixRowAction')
    expect(matrix).toContain('pagePermissionId')
    expect(matrix).toContain('pageAccessLabel')
    expect(matrix).toContain('groupSelectLabel')
    expect(diff).toContain('defineModel<boolean>')
    expect(diff).toContain('addedLabels')
    expect(diff).toContain('removedLabels')
  })
})
