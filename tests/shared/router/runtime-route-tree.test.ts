import { describe, expect, it } from 'vitest'
import { buildRuntimeRouteTree } from '@/router/runtime-route-tree'

describe('legacy runtime route adapter', () => {
  it('omits an unknown view instead of silently installing DeadPage', () => {
    const tree = buildRuntimeRouteTree([
      {
        path: '/system/missing',
        name: 'system-missing',
        view_key: 'system/missing',
        meta: { menuId: '88' },
      },
    ])

    expect(tree).toEqual([])
  })

  it('resolves an exact generated view and keeps the documented metadata', () => {
    const tree = buildRuntimeRouteTree([
      {
        path: '/system/setting',
        name: 'system-setting',
        view_key: 'system/setting',
        meta: { menuId: '41' },
      },
    ])

    expect(tree).toHaveLength(1)
    expect(tree[0]).toMatchObject({
      path: '/system/setting',
      name: 'system-setting',
      meta: { menuId: '41', pageLayout: 'card' },
    })
  })
})
