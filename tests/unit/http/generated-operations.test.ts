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

  it('classifies a missing documented response field separately', async () => {
    const harness = installApiClientHarness({
      list: [],
      page: { current_page: 1, page_size: 20, total: 0 },
    })
    cleanups.push(harness.uninstall)

    await expect(executeAdminOperation(adminOperations.get_api_admin_v1_users, {
      query: { current_page: 1, page_size: 20 },
    })).rejects.toMatchObject({
      kind: 'contract',
      code: 'http.response_required_field_missing',
    })
  })

  it('keeps a wrong response field type as a schema error', async () => {
    const harness = installApiClientHarness({
      list: [],
      page: { current_page: 1, page_size: 20, total: 0, total_page: 'invalid' },
    })
    cleanups.push(harness.uninstall)

    await expect(executeAdminOperation(adminOperations.get_api_admin_v1_users, {
      query: { current_page: 1, page_size: 20 },
    })).rejects.toMatchObject({
      kind: 'contract',
      code: 'http.response_schema_invalid',
    })
  })

  it('accepts historical message attachments without storage metadata', async () => {
    const harness = installApiClientHarness({
      list: [{
        id: 3,
        role: 2,
        content_type: 'text',
        content: 'historical image',
        meta_json: {
          attachments: [{
            type: 'image',
            url: 'https://example.test/history.jpg',
            name: 'history.jpg',
            size: 97_523,
          }],
        },
        paired_message_id: null,
        run_id: null,
        liked: false,
        created_at: '2026-07-29 09:00:00',
        updated_at: '2026-07-29 09:00:00',
      }],
      next_id: 0,
      has_more: false,
    })
    cleanups.push(harness.uninstall)

    const response = await executeAdminOperation(
      adminOperations.get_api_admin_v1_ai_conversations_id_messages,
      { path: { id: 162 }, query: {} },
    )

    expect(response.list[0]?.meta_json?.attachments?.[0]).toEqual({
      type: 'image',
      url: 'https://example.test/history.jpg',
      name: 'history.jpg',
      size: 97_523,
    })
  })
})
