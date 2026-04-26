import { describe, expect, it } from 'vitest'
import { PermissionTypeEnum, PlatformEnum } from '@/enums'
import {
  buildPermissionSuggestion,
  isPermissionParentSelectable,
  normalizePermissionParentId,
} from '@/views/Main/permission/permission/helpers'

const dirNode = { id: 1, value: 1, label: '系统', parent_id: 0, platform: PlatformEnum.ADMIN, type: PermissionTypeEnum.DIR }
const pageNode = { id: 2, value: 2, label: '用户页', parent_id: 1, platform: PlatformEnum.ADMIN, type: PermissionTypeEnum.PAGE }
const appPageNode = { id: 3, value: 3, label: 'APP页', parent_id: 0, platform: PlatformEnum.APP, type: PermissionTypeEnum.PAGE }

describe('permission definition helpers', () => {
  it('filters selectable parents by platform and node type', () => {
    expect(isPermissionParentSelectable(dirNode, { platform: PlatformEnum.ADMIN, type: PermissionTypeEnum.DIR })).toBe(true)
    expect(isPermissionParentSelectable(pageNode, { platform: PlatformEnum.ADMIN, type: PermissionTypeEnum.DIR })).toBe(false)
    expect(isPermissionParentSelectable(dirNode, { platform: PlatformEnum.ADMIN, type: PermissionTypeEnum.PAGE })).toBe(true)
    expect(isPermissionParentSelectable(pageNode, { platform: PlatformEnum.ADMIN, type: PermissionTypeEnum.BUTTON })).toBe(true)
    expect(isPermissionParentSelectable(dirNode, { platform: PlatformEnum.ADMIN, type: PermissionTypeEnum.BUTTON })).toBe(false)
    expect(isPermissionParentSelectable(appPageNode, { platform: PlatformEnum.ADMIN, type: PermissionTypeEnum.BUTTON })).toBe(false)
  })

  it('allows empty parent only for root-safe types', () => {
    expect(normalizePermissionParentId('', { platform: PlatformEnum.ADMIN, type: PermissionTypeEnum.DIR })).toBe(0)
    expect(normalizePermissionParentId('', { platform: PlatformEnum.ADMIN, type: PermissionTypeEnum.PAGE })).toBe(0)
    expect(normalizePermissionParentId('', { platform: PlatformEnum.APP, type: PermissionTypeEnum.BUTTON })).toBe(0)
    expect(() => normalizePermissionParentId('', { platform: PlatformEnum.ADMIN, type: PermissionTypeEnum.BUTTON })).toThrow('admin button requires a page parent')
  })

  it('builds deterministic suggestions from view key and action', () => {
    expect(buildPermissionSuggestion({ type: PermissionTypeEnum.PAGE, viewKey: 'user/userManager' })).toEqual({
      path: '/user/userManager',
      component: 'user/userManager',
      i18n_key: 'menu.user_userManager',
    })

    expect(buildPermissionSuggestion({ type: PermissionTypeEnum.BUTTON, domain: 'user', entity: 'userManager', action: 'edit' })).toEqual({
      code: 'user_userManager_edit',
    })
  })
})
