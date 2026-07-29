import { afterEach, describe, expect, it } from 'vitest'
import { AiOfficialModelApi } from '@/api/ai/official-models'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('AI official model API contract', () => {
  it('uses the final list, detail, complete price sync, and restore endpoints', async () => {
    const harness = installApiClientHarness({ dict: {
      vendor_options: [], family_options: [], lifecycle_options: [], input_modality_options: [],
    } })
    cleanups.push(harness.uninstall)

    await AiOfficialModelApi.pageInit()
    harness.respondWith({ list: [] })
    await AiOfficialModelApi.list({
      vendor: 'openai', family: 'gpt', lifecycle: 'active', input_modality: 'image', model_id: '  gpt-5.4  ',
    })

    const rate = { category: 'input' as const, price: '2.5', tier_key: '', unit: 'token', unit_scale: 1_000_000 }
    const official = {
      available: true,
      override_version: 0,
      pricing_version: 'official_models_v1',
      rates: [rate],
      source: 'official',
      source_url: 'https://developers.openai.com/api/docs/pricing',
      verified_at: '2026-07-27',
    }
    harness.respondWith({
      aliases: ['gpt-5.4-latest'],
      capabilities: {
        image_input: { max_bytes: 10_485_760, max_files: 5, mime_types: ['image/png'] },
        input_modalities: ['text', 'image'],
        native_file_input: false,
        output_modalities: ['text'],
        supported_parameters: ['temperature'],
        supports_streaming: true,
        supports_structured_output: true,
        supports_tools: true,
      },
      catalog_vendor: 'openai',
      catalog_version: 'official_models_v1',
      context_tier_threshold_tokens: 272_000,
      context_window_tokens: 1_050_000,
      effective: official,
      lifecycle_status: 'active',
      max_output_tokens: 128_000,
      model_family: 'gpt',
      model_id: 'gpt-5.4',
      model_source_url: 'https://developers.openai.com/api/docs/models/gpt-5.4',
      official,
      pricing_profile: 'standard_global',
      pricing_source_url: 'https://developers.openai.com/api/docs/pricing',
      retrieved_at: '2026-07-27',
      review_after: '2026-08-27',
    })
    await AiOfficialModelApi.detail({ model_id: 'gpt-5.4' })

    const rates = [
      { category: 'input' as const, price: '2.75', tier_key: 'short_context', unit: 'token', unit_scale: 1_000_000 },
      { category: 'output' as const, price: '16.5', tier_key: 'short_context', unit: 'token', unit_scale: 1_000_000 },
    ]
    harness.respondWith({ before: official, after: { ...official, source: 'override', override_version: 3 } })
    await AiOfficialModelApi.syncPrice({
      model_id: 'gpt-5.4',
      expected_version: 3,
      rates,
      source_url: 'https://developers.openai.com/api/docs/pricing',
      verified_at: '2026-07-27',
    })
    await AiOfficialModelApi.restoreOfficialPrice({ model_id: 'gpt-5.4', expected_version: 4 })

    expect(harness.requests.map(({ method, path, query, body }) => ({ method, path, query, body }))).toEqual([
      { method: 'GET', path: '/api/admin/v1/ai-official-models/page-init', query: undefined, body: undefined },
      {
        method: 'GET',
        path: '/api/admin/v1/ai-official-models',
        query: { vendor: 'openai', family: 'gpt', lifecycle: 'active', input_modality: 'image', model_id: 'gpt-5.4' },
        body: undefined,
      },
      { method: 'GET', path: '/api/admin/v1/ai-official-models/gpt-5.4', query: undefined, body: undefined },
      {
        method: 'PUT',
        path: '/api/admin/v1/ai-official-models/gpt-5.4/price',
        query: undefined,
        body: { expected_version: 3, rates, source_url: 'https://developers.openai.com/api/docs/pricing', verified_at: '2026-07-27' },
      },
      {
        method: 'DELETE',
        path: '/api/admin/v1/ai-official-models/gpt-5.4/price-override',
        query: { expected_version: 4 },
        body: undefined,
      },
    ])
  })

  it('omits empty filters and rejects blank model identities before transport', async () => {
    const harness = installApiClientHarness({ list: [] })
    cleanups.push(harness.uninstall)

    await AiOfficialModelApi.list({ vendor: '', family: '', lifecycle: '', input_modality: '', model_id: '   ' })
    expect(harness.requests[0]?.query).toEqual({})
    expect(() => AiOfficialModelApi.detail({ model_id: '   ' })).toThrow(/model id/i)
    expect(harness.requests).toHaveLength(1)
  })

  it('normalizes nullable collection fields at the API boundary', async () => {
    const price = {
      available: true,
      override_version: 0,
      pricing_version: 'official_models_v1',
      rates: null,
      source: 'official',
      source_url: 'https://developers.openai.com/api/docs/pricing',
      verified_at: '2026-07-29',
    }
    const wireItem = {
      aliases: null,
      capabilities: {
        image_input: { max_bytes: 10_485_760, max_files: 5, mime_types: null },
        input_modalities: null,
        native_file_input: false,
        output_modalities: null,
        supported_parameters: null,
        supports_streaming: true,
        supports_structured_output: true,
        supports_tools: true,
      },
      catalog_vendor: 'openai',
      catalog_version: 'official_models_v1',
      context_tier_threshold_tokens: 272_000,
      context_window_tokens: 1_050_000,
      effective: price,
      lifecycle_status: 'active',
      max_output_tokens: 128_000,
      model_family: 'gpt',
      model_id: 'gpt-5.6-sol',
      model_source_url: 'https://developers.openai.com/api/docs/models/gpt-5.6-sol',
      official: price,
      pricing_profile: 'standard_global',
      pricing_source_url: 'https://developers.openai.com/api/docs/pricing',
      retrieved_at: '2026-07-29',
      review_after: '2026-10-29',
    }
    const harness = installApiClientHarness(wireItem)
    cleanups.push(harness.uninstall)

    const detail = await AiOfficialModelApi.detail({ model_id: wireItem.model_id })
    expect(detail.aliases).toEqual([])
    expect(detail.capabilities.input_modalities).toEqual([])
    expect(detail.capabilities.output_modalities).toEqual([])
    expect(detail.capabilities.supported_parameters).toEqual([])
    expect(detail.capabilities.image_input?.mime_types).toEqual([])
    expect(detail.official.rates).toEqual([])
    expect(detail.effective.rates).toEqual([])

    harness.respondWith({ list: [wireItem] })
    const list = await AiOfficialModelApi.list()
    expect(list.list[0]?.aliases).toEqual([])

    harness.respondWith({ before: price, after: price })
    const synced = await AiOfficialModelApi.syncPrice({
      model_id: wireItem.model_id,
      expected_version: 0,
      rates: [],
      source_url: price.source_url,
      verified_at: price.verified_at,
    })
    expect(synced.before.rates).toEqual([])
    expect(synced.after.rates).toEqual([])

    harness.respondWith({ before: price, after: price })
    const restored = await AiOfficialModelApi.restoreOfficialPrice({
      model_id: wireItem.model_id,
      expected_version: 1,
    })
    expect(restored.before.rates).toEqual([])
    expect(restored.after.rates).toEqual([])
  })
})
