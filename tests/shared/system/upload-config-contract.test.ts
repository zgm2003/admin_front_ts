import { afterEach, describe, expect, it } from 'vitest'
import { UploadDriverApi, UploadSettingApi } from '@/api/system/uploadConfig'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

const emptyPage = {
  current_page: 1,
  page_size: 20,
  total: 0,
  total_page: 0,
}

describe('upload configuration API contract', () => {
  it('rejects an undocumented upload driver filter without sending a request', async () => {
    const harness = installApiClientHarness({ list: [], page: emptyPage })
    cleanups.push(harness.uninstall)

    await expect(UploadDriverApi.list({
      current_page: 1,
      page_size: 20,
      driver: 's3' as never,
    })).rejects.toThrow(/driver/i)

    expect(harness.requests).toEqual([])
  })

  it('rejects string upload setting identities instead of rewriting or omitting them', async () => {
    const harness = installApiClientHarness({ list: [], page: emptyPage })
    cleanups.push(harness.uninstall)

    await expect(UploadSettingApi.list({
      current_page: 1,
      page_size: 20,
      driver_id: '7' as never,
    })).rejects.toThrow(/driver_id/i)
    await expect(UploadSettingApi.list({
      current_page: 1,
      page_size: 20,
      rule_id: 'not-an-id' as never,
    })).rejects.toThrow(/rule_id/i)

    expect(harness.requests).toEqual([])
  })
})
