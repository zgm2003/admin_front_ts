import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const featureRoot = 'e:/admin/admin_front_ts/src/views/Main/permission/permission'

function readFeatureFile(path: string) {
  return readFileSync(resolve(featureRoot, path), 'utf8')
}

describe('permission page platform scope', () => {
  it('keeps platform state in the definition page composable', () => {
    const source = readFeatureFile('composables/usePermissionDefinitionPage.ts')

    expect(source).toContain("const platformOptions = ref<PermissionInitResponse['dict']['permission_platform_arr']>([])")
    expect(source).toContain('const activePlatform = shallowRef<string>(PlatformEnum.ADMIN)')
    expect(source).toContain('platformOptions.value = data.dict.permission_platform_arr')
    expect(source).toContain('platform: activePlatform.value')
    expect(source).toContain('function switchPlatform(platform?: string)')
    expect(source).not.toContain('PERMISSION_PAGE_PLATFORM')
  })

  it('renders platform switching through a focused tabs component', () => {
    const index = readFeatureFile('index.vue')
    const tabs = readFeatureFile('components/PlatformTabs.vue')

    expect(index).toContain('PlatformTabs')
    expect(index).toContain('v-model="activePlatform"')
    expect(index).toContain('@change="switchPlatform"')
    expect(tabs).toContain('<el-tabs')
    expect(tabs).toContain('v-model="model"')
    expect(tabs).toContain('@tab-change="handleChange"')
  })

  it('removes legacy appButton permission APIs from the frontend contract', () => {
    const source = readFileSync(resolve('e:/admin/admin_front_ts/src/api/permission/permission.ts'), 'utf8')

    expect(source).not.toContain('appButtonList')
    expect(source).not.toContain('appButtonAdd')
    expect(source).not.toContain('appButtonEdit')
    expect(source).not.toContain('appButtonStatus')
    expect(source).not.toContain('appButtonDel')
    expect(source).not.toContain('AppButtonItem')
    expect(source).not.toContain('AppButtonMutationPayload')
  })

  it('removes the legacy appButton page component', () => {
    expect(existsSync(resolve('e:/admin/admin_front_ts/src/views/Main/permission/appButton/index.vue'))).toBe(false)
  })
})
