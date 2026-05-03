import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('role permission matrix UI contract', () => {
  it('uses matrix components instead of the old cascader permission editor', () => {
    const source = readFrontendSource('src/views/Main/permission/role/index.vue')

    expect(source).toContain('RolePermissionMatrix')
    expect(source).toContain('RolePermissionDiffDialog')
    expect(source).toContain('buildRolePermissionMatrix')
    expect(source).toContain('getRoleMatrixGroupPermissionIds')
    expect(source).toContain('diffPermissionIds')
    expect(source).toContain(':height="isMobile ? \'72vh\' : \'min(72vh, 720px)\'"')
    expect(source).toContain('permission_platform_arr')
    expect(source).toContain('<el-tabs')
    expect(source).not.toContain('<el-cascader')
    expect(source).not.toContain('buildLeafSelectablePermissionTree')
  })

  it('keeps matrix and diff UI in focused child components', () => {
    const matrix = readFrontendSource('src/views/Main/permission/role/components/RolePermissionMatrix.vue')
    const diff = readFrontendSource('src/views/Main/permission/role/components/RolePermissionDiffDialog.vue')

    expect(matrix).toContain('defineModel<number[]>')
    expect(matrix).toContain('RoleMatrixGroup')
    expect(matrix).toContain('toggleMatrixGroup')
    expect(matrix).toContain('toggleMatrixPage')
    expect(matrix).toContain('toggleMatrixRowAction')
    expect(matrix).toContain('getRoleMatrixGroupSelectionState')
    expect(matrix).toContain('selectedIdSet')
    expect(matrix).toContain('collapsedGroupIds')
    expect(matrix).toContain('toggleGroupCollapse')
    expect(matrix).toContain('isGroupCollapsed')
    expect(matrix).toContain('pagePermissionId')
    expect(matrix).toContain('pageAccessLabel')
    expect(matrix).toContain('groupSelectLabel')
    expect(matrix).toContain('groupClearLabel')
    expect(matrix).toContain('groupExpandLabel')
    expect(matrix).toContain('groupCollapseLabel')
    expect(matrix).toContain('helperText')
    expect(diff).toContain('defineModel<boolean>')
    expect(diff).toContain('addedLabels')
    expect(diff).toContain('removedLabels')
  })
})
