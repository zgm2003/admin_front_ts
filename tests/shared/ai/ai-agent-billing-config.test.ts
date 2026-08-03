import { afterEach, describe, expect, it } from 'vitest'
import { AiAgentApi } from '@/api/ai/agents'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('AI agent billing configuration contract', () => {
  it('keeps multiplier and current effective catalog metadata as readonly facts', async () => {
    const dict = {
      billing_multiplier_default: '1.25',
      scene_arr: [{ label: 'Chat', value: 'chat' }],
      common_status_arr: [{ label: 'Enabled', value: 1 }],
      provider_options: [{ label: 'Gateway', value: 10, engine_type: 'openai' }],
      provider_model_options: [{
        billing_multiplier: '1.125',
        catalog_model_id: 'gpt-5.4',
        catalog_rates: [{ category: 'input', price: '0.00000125', tier_key: '', unit: 'token', unit_scale: 1 }],
        catalog_vendor: 'openai', catalog_version: 'official_models_v1', context_tier_threshold_tokens: 272000,
        display_name: 'GPT 5.4', label: 'GPT 5.4', model_id: 'gpt-5.4', override_version: 2,
        price_source: 'override', price_source_url: 'https://openai.com/pricing', price_verified_at: '2026-07-27',
        pricing_version: 'official_models_v1:override:2', provider_id: 10, value: 'gpt-5.4',
        official_model: {
          model_id: 'gpt-5.4', catalog_version: 'official_models_v1', catalog_vendor: 'openai', model_family: 'gpt',
          lifecycle_status: 'active', context_window_tokens: 1_050_000, max_output_tokens: 128_000,
        },
        capabilities: {
          input_modalities: ['text'], output_modalities: ['text'], supports_tools: true, supports_streaming: true,
          supports_structured_output: false,
          runtime_parameters: {
            temperature: { supported: true, default: 1, min: 0, max: 2 },
          },
          attachments: {
            image: { enabled: false, mime_types: [], max_files: 0, max_file_bytes: 0 },
            native_file: { enabled: false },
          },
        },
      }],
    }
    const harness = installApiClientHarness({ dict })
    cleanups.push(harness.uninstall)

    await expect(AiAgentApi.pageInit()).resolves.toEqual({ dict })
    expect(JSON.stringify(dict)).not.toContain('max_output_tokens_default')
  })
})
