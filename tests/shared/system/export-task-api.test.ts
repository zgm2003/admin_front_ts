import { afterEach, describe, expect, it } from 'vitest'
import { ExportTaskApi } from '@/api/system/exportTask'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('export task API behavior', () => {
  it('executes documented list, status, and deletion operations', async () => {
    const harness = installApiClientHarness([])
    cleanups.push(harness.uninstall)
    await ExportTaskApi.statusCount({})
    harness.respondWith({
      list: [],
      next_id: 0,
      page: { current_page: 1, page_size: 20, total: 0, total_page: 0 },
    })
    await ExportTaskApi.list({ current_page: 1, page_size: 20 })
    harness.respondWith({})
    await ExportTaskApi.deleteOne({ id: 7 })
    await ExportTaskApi.deleteBatch({ ids: [8, 9] })

    expect(harness.requests.map(({ method, path }) => [method, path])).toEqual([
      ['GET', '/api/admin/v1/export-tasks/status-count'],
      ['GET', '/api/admin/v1/export-tasks'],
      ['DELETE', '/api/admin/v1/export-tasks/7'],
      ['DELETE', '/api/admin/v1/export-tasks'],
    ])
  })

  it('rejects an invalid export identity before transport', async () => {
    const harness = installApiClientHarness()
    cleanups.push(harness.uninstall)
    await expect(ExportTaskApi.deleteOne({ id: 0 })).rejects.toThrow(/positive integer/i)
    expect(harness.requests).toEqual([])
  })
})
