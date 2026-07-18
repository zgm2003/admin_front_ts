import { afterEach, describe, expect, it } from 'vitest'
import { PermissionApi } from '@/api/permission/permission'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('permission API behavior', () => {
  it('executes the documented permission resource operations', async () => {
    const harness = installApiClientHarness({})
    cleanups.push(harness.uninstall)
    await PermissionApi.pageInit()
    harness.respondWith([])
    await PermissionApi.list({ platform: 'admin' })
    harness.respondWith({ id: 4 })
    await PermissionApi.create({ platform: 'admin' } as never)
    harness.respondWith({})
    await PermissionApi.update({ id: 4, platform: 'admin' } as never)
    await PermissionApi.changeStatus({ id: 4, status: 1 })
    await PermissionApi.deleteOne({ id: 4 })
    await PermissionApi.deleteBatch({ ids: [4, 5] })

    expect(harness.requests.map(({ method, path }) => [method, path])).toEqual([
      ['GET', '/api/admin/v1/permissions/page-init'],
      ['GET', '/api/admin/v1/permissions'],
      ['POST', '/api/admin/v1/permissions'],
      ['PUT', '/api/admin/v1/permissions/4'],
      ['PATCH', '/api/admin/v1/permissions/4/status'],
      ['DELETE', '/api/admin/v1/permissions/4'],
      ['DELETE', '/api/admin/v1/permissions'],
    ])
  })
})
