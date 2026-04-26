import { describe, expect, it } from 'vitest'
import { PermissionTypeEnum, PlatformEnum } from '@/enums'
import {
  buildRolePermissionMatrix,
  diffPermissionIds,
  toggleMatrixAction,
} from '@/views/Main/permission/role/role-matrix'

const tree = [{
  id: 1,
  value: 1,
  label: '[PC后台] 用户',
  parent_id: 0,
  platform: PlatformEnum.ADMIN,
  type: PermissionTypeEnum.DIR,
  children: [{
    id: 2,
    value: 2,
    label: '[PC后台] 用户管理',
    parent_id: 1,
    platform: PlatformEnum.ADMIN,
    type: PermissionTypeEnum.PAGE,
    children: [
      { id: 3, value: 3, label: '新增', parent_id: 2, platform: PlatformEnum.ADMIN, type: PermissionTypeEnum.BUTTON, code: 'user_userManager_add' },
      { id: 4, value: 4, label: '编辑', parent_id: 2, platform: PlatformEnum.ADMIN, type: PermissionTypeEnum.BUTTON, code: 'user_userManager_edit' },
    ],
  }],
}]

describe('role permission matrix', () => {
  it('builds matrix rows from page nodes and button children', () => {
    expect(buildRolePermissionMatrix(tree, PlatformEnum.ADMIN)).toEqual([{
      pageId: 2,
      pageLabel: '[PC后台] 用户管理',
      platform: PlatformEnum.ADMIN,
      actions: [
        { id: 3, code: 'user_userManager_add', label: '新增' },
        { id: 4, code: 'user_userManager_edit', label: '编辑' },
      ],
    }])
  })

  it('keeps root-level non-admin buttons assignable', () => {
    const appRootButton = [{
      id: 10,
      value: 10,
      label: '扫码提交',
      parent_id: 0,
      platform: PlatformEnum.APP,
      type: PermissionTypeEnum.BUTTON,
      code: 'scan_submit',
    }]

    expect(buildRolePermissionMatrix(appRootButton, PlatformEnum.APP)).toEqual([{
      pageId: 10,
      pageLabel: '扫码提交',
      platform: PlatformEnum.APP,
      actions: [
        { id: 10, code: 'scan_submit', label: '扫码提交' },
      ],
    }])
  })

  it('toggles action ids without duplicates', () => {
    expect(toggleMatrixAction([3], 4, true)).toEqual([3, 4])
    expect(toggleMatrixAction([3, 4], 4, true)).toEqual([3, 4])
    expect(toggleMatrixAction([3, 4], 3, false)).toEqual([4])
  })

  it('diffs selected permission ids before save', () => {
    expect(diffPermissionIds([3, 4], [4, 5])).toEqual({ added: [5], removed: [3] })
  })
})
