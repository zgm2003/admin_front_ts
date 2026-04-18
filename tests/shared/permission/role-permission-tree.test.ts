import { describe, expect, it } from 'vitest'
import { buildLeafSelectablePermissionTree, collectLeafPermissionIds } from '@/views/Main/permission/role/helpers'

const permissionTree = [
  {
    id: 1,
    label: '系统管理',
    value: 1,
    parent_id: 0,
    platform: 'admin',
    children: [
      {
        id: 2,
        label: '通知管理',
        value: 2,
        parent_id: 1,
        platform: 'admin',
      },
    ],
  },
  {
    id: 3,
    label: '通知中心',
    value: 3,
    parent_id: 0,
    platform: 'admin',
  },
]

describe('role permission tree helpers', () => {
  it('marks only leaf nodes selectable for cascader options', () => {
    const tree = buildLeafSelectablePermissionTree(permissionTree)

    expect(tree[0].disabled).toBe(true)
    expect(tree[0].children?.[0].disabled).toBe(false)
    expect(tree[1].disabled).toBe(false)
  })

  it('collects only leaf permission ids for select-all', () => {
    expect(collectLeafPermissionIds(permissionTree)).toEqual([2, 3])
  })
})
