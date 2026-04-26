import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const featureRoot = 'e:/admin/admin_front_ts/src/views/Main/permission/permission'

describe('permission definition page structure', () => {
  it('keeps route view as a thin composition layer', () => {
    const source = readFileSync(resolve(featureRoot, 'index.vue'), 'utf8')

    expect(source).toContain('usePermissionDefinitionPage')
    expect(source).toContain('PlatformTabs')
    expect(source).toContain('PermissionTreeTable')
    expect(source).toContain('PermissionDefinitionDialog')
    expect(source).toContain('PermissionHealthPanel')
    expect(source).not.toContain('const createDefaultForm =')
    expect(source).not.toContain('<el-table')
    expect(source).not.toContain('<el-form')
  })

  it('moves permission editor implementation into focused files', () => {
    for (const path of [
      'composables/usePermissionDefinitionPage.ts',
      'components/PlatformTabs.vue',
      'components/PermissionTreeTable.vue',
      'components/PermissionDefinitionDialog.vue',
      'components/PermissionHealthPanel.vue',
    ]) {
      expect(existsSync(resolve(featureRoot, path))).toBe(true)
    }
  })
})
