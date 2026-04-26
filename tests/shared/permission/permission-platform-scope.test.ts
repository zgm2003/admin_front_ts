import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('permission page platform scope', () => {
  it('allows the permission tree page to switch platform instead of locking admin', () => {
    const source = readFileSync(resolve('e:/admin/admin_front_ts/src/views/Main/permission/permission/index.vue'), 'utf8')

    expect(source).toContain("const platformOptions = ref<PermissionInitResponse['dict']['permission_platform_arr']>([])")
    expect(source).toContain('const activePlatform = ref<string>(PlatformEnum.ADMIN)')
    expect(source).toContain('platformOptions.value = data.dict.permission_platform_arr')
    expect(source).toContain('platform: activePlatform.value')
    expect(source).toContain('<el-tabs')
    expect(source).toContain('v-model="activePlatform"')
    expect(source).toContain('@tab-change="onPlatformChange"')
    expect(source).not.toContain('PERMISSION_PAGE_PLATFORM')
  })
})
