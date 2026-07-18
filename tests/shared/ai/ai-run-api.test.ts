import { afterEach, describe, expect, it } from 'vitest'
import { AiRunApi } from '@/api/ai/runs'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('AI run API behavior', () => {
  it('executes the documented run monitor read operations', async () => {
    const harness = installApiClientHarness({
      dict: { status_arr: [], platform_arr: [], agentArr: [], providerArr: [] },
    })
    cleanups.push(harness.uninstall)
    await AiRunApi.pageInit()

    harness.respondWith({ list: [], page: { current_page: 1, page_size: 20, total: 0 } })
    await AiRunApi.list({ current_page: 1, page_size: 20 })
    harness.respondWith({})
    await AiRunApi.detail({ id: 7 })
    await AiRunApi.stats()
    harness.respondWith({ list: [], page: { current_page: 1, page_size: 20, total: 0 } })
    const statsParams = { current_page: 1, page_size: 20 }
    await AiRunApi.statsByDate(statsParams)
    await AiRunApi.statsByAgent(statsParams)
    await AiRunApi.statsByUser(statsParams)

    expect(harness.requests.map(({ method, path }) => [method, path])).toEqual([
      ['GET', '/api/admin/v1/ai-runs/page-init'],
      ['GET', '/api/admin/v1/ai-runs'],
      ['GET', '/api/admin/v1/ai-runs/7'],
      ['GET', '/api/admin/v1/ai-runs/stats'],
      ['GET', '/api/admin/v1/ai-runs/stats/by-date'],
      ['GET', '/api/admin/v1/ai-runs/stats/by-agent'],
      ['GET', '/api/admin/v1/ai-runs/stats/by-user'],
    ])
  })

  it('fails closed when page-init omits a required dictionary', async () => {
    const harness = installApiClientHarness({
      dict: { status_arr: [], platform_arr: [], agentArr: [] },
    })
    cleanups.push(harness.uninstall)

    await expect(AiRunApi.pageInit()).rejects.toThrow(/providerArr must be an array/)
  })
})
