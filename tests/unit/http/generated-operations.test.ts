import { afterEach, describe, expect, it } from 'vitest'
import { executeAdminOperation } from '@/lib/http'
import { adminOperations } from '@/modules/http/generated/operations'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('generated Admin operation descriptors', () => {
  it('encodes exact documented query, path, and body inputs', async () => {
    const harness = installApiClientHarness({
      list: [],
      page: { current_page: 1, page_size: 20, total: 0, total_page: 0 },
    })
    cleanups.push(harness.uninstall)

    await executeAdminOperation(adminOperations.get_api_admin_v1_users, {
      query: { current_page: 1, page_size: 20, sex: 0 },
    })
    harness.respondWith({})
    await executeAdminOperation(adminOperations.patch_api_admin_v1_users_id_status, {
      path: { id: 9301 },
      body: { status: 2 },
    })

    expect(harness.requests.map(({ method, path, query, body }) => ({
      method,
      path,
      query,
      body,
    }))).toEqual([
      {
        method: 'GET',
        path: '/api/admin/v1/users',
        query: { current_page: 1, page_size: 20, sex: 0 },
        body: undefined,
      },
      {
        method: 'PATCH',
        path: '/api/admin/v1/users/9301/status',
        query: undefined,
        body: { status: 2 },
      },
    ])
  })

  it('rejects a successful envelope whose data violates the formal response schema', async () => {
    const harness = installApiClientHarness({
      list: [],
      page: { current_page: 1, page_size: 20, total: 0 },
    })
    cleanups.push(harness.uninstall)

    await expect(executeAdminOperation(adminOperations.get_api_admin_v1_users, {
      query: { current_page: 1, page_size: 20 },
    })).rejects.toMatchObject({
      kind: 'contract',
      code: 'http.response_schema_invalid',
    })
  })
})
