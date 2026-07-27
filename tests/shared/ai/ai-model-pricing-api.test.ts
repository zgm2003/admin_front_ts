import { afterEach, describe, expect, it } from 'vitest'
import { AiModelPriceApi } from '@/api/ai/model-prices'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('AI model pricing API contract', () => {
  it('uses generated list, detail, full override, and restore operations', async () => {
    const harness = installApiClientHarness({ list: [] })
    cleanups.push(harness.uninstall)

    await AiModelPriceApi.list({ family: 'gpt', model_id: '  gpt-5.4  ' })
    const rate = { category: 'input', price: '2.5', tier_key: '', unit: 'token', unit_scale: 1_000_000 }
    const official = {
      available: true,
      override_version: 0,
      pricing_version: 'official_numeric_parity_v3',
      rates: [rate],
      source: 'official',
      source_url: 'https://developers.openai.com/api/docs/pricing',
      verified_at: '2026-07-27',
    }
    harness.respondWith({
      aliases: [],
      catalog_vendor: 'openai',
      catalog_version: 'official_numeric_parity_v3',
      context_tier_threshold_tokens: 272_000,
      effective: official,
      max_output_tokens: 128_000,
      model_family: 'gpt',
      model_id: 'gpt-5.4',
      official,
      pricing_profile: 'standard_global',
      review_after: '',
    })
    await AiModelPriceApi.detail({ model_id: 'gpt-5.4' })

    const rates = [
      { category: 'input' as const, price: '2.75', tier_key: 'short_context', unit: 'token', unit_scale: 1_000_000 },
      { category: 'output' as const, price: '16.5', tier_key: 'short_context', unit: 'token', unit_scale: 1_000_000 },
    ]
    harness.respondWith({ before: official, after: { ...official, source: 'override', override_version: 3 } })
    await AiModelPriceApi.update({
      model_id: 'gpt-5.4',
      expected_version: 3,
      rates,
      source_url: 'https://developers.openai.com/api/docs/pricing',
      verified_at: '2026-07-27',
    })
    await AiModelPriceApi.restore({ model_id: 'gpt-5.4', expected_version: 4 })

    expect(harness.requests.map(({ method, path, query, body }) => ({ method, path, query, body }))).toEqual([
      {
        method: 'GET',
        path: '/api/admin/v1/ai-model-prices',
        query: { family: 'gpt', model_id: 'gpt-5.4' },
        body: undefined,
      },
      {
        method: 'GET',
        path: '/api/admin/v1/ai-model-prices/gpt-5.4',
        query: undefined,
        body: undefined,
      },
      {
        method: 'PUT',
        path: '/api/admin/v1/ai-model-prices/gpt-5.4',
        query: undefined,
        body: {
          expected_version: 3,
          rates,
          source_url: 'https://developers.openai.com/api/docs/pricing',
          verified_at: '2026-07-27',
        },
      },
      {
        method: 'DELETE',
        path: '/api/admin/v1/ai-model-prices/gpt-5.4/override',
        query: { expected_version: 4 },
        body: undefined,
      },
    ])
  })

  it('omits empty filters and rejects blank model identities before transport', async () => {
    const harness = installApiClientHarness({ list: [] })
    cleanups.push(harness.uninstall)

    await AiModelPriceApi.list({ family: '', model_id: '   ' })
    expect(harness.requests[0]?.query).toEqual({})
    expect(() => AiModelPriceApi.detail({ model_id: '   ' })).toThrow(/model id/i)
    expect(harness.requests).toHaveLength(1)
  })
})
