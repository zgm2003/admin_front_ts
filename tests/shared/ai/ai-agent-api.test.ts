import { afterEach, describe, expect, it } from 'vitest'
import { AiAgentApi } from '@/api/ai/agents'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

const capabilities = {
  input_modalities: ['text', 'image'], output_modalities: ['text'], supports_tools: true,
  supports_streaming: true, supports_structured_output: false,
  runtime_parameters: {
    temperature: { supported: true, default: 1, min: 0, max: 2 },
  },
  attachments: {
    image: { enabled: true, mime_types: ['image/png'], max_files: 5, max_file_bytes: 10_485_760 },
    native_file: { enabled: false },
  },
}

describe('AI agent API behavior', () => {
  it('accepts final page-init data without a configurable output limit', async () => {
    const dict = {
      billing_multiplier_default: '1',
      scene_arr: [
        { label: 'Chat', value: 'chat' },
        { label: 'Tool Generation', value: 'agent_generate' },
        { label: 'Text Generation', value: 'text_generate' },
        { label: 'Image Generation', value: 'image_generate' },
      ],
      common_status_arr: [{ label: 'Enabled', value: 1 }, { label: 'Disabled', value: 2 }],
      provider_options: [{ label: 'test', value: 10, engine_type: 'openai' }],
      provider_model_options: [{
        label: 'gpt-5.4', value: 'gpt-5.4', provider_id: 10, model_id: 'gpt-5.4', display_name: 'gpt-5.4',
        billing_multiplier: '1', capabilities,
        official_model: {
          model_id: 'gpt-5.4', catalog_version: 'official_models_v1', catalog_vendor: 'openai', model_family: 'gpt',
          lifecycle_status: 'active', context_window_tokens: 1_050_000, max_output_tokens: 128_000,
        },
        override_version: 0,
        context_tier_threshold_tokens: 272_000,
      }],
    }
    const harness = installApiClientHarness({ dict })
    cleanups.push(harness.uninstall)

    await expect(AiAgentApi.pageInit()).resolves.toEqual({ dict })
    expect(harness.requests.map(({ method, path }) => [method, path])).toEqual([
      ['GET', '/api/admin/v1/ai-agents/page-init'],
    ])
  })

  it('never serializes max_output_tokens in agent mutations', async () => {
    const harness = installApiClientHarness({ id: 41 })
    cleanups.push(harness.uninstall)
    const payload = {
      name: 'Priced agent', provider_id: 10, model_id: 'gpt-5.4', scenes: ['chat'] as Array<'chat'>,
      status: 1 as const, system_prompt: 'Be concise.', avatar: '', billing_multiplier: '1.375',
    }

    await AiAgentApi.create(payload)
    harness.respondWith({})
    await AiAgentApi.update({ ...payload, id: 41 })

    expect(harness.requests.map(({ body }) => body)).toEqual([payload, payload])
    expect(JSON.stringify(harness.requests)).not.toContain('max_output_tokens')
  })

  it.each(['video_generate', 'audio_generate'])('rejects retired scene %s from page-init', async (scene) => {
    const harness = installApiClientHarness({ dict: {
      billing_multiplier_default: '1', scene_arr: [{ label: 'Retired', value: scene }],
      common_status_arr: [{ label: 'Enabled', value: 1 }], provider_options: [], provider_model_options: [],
    } })
    cleanups.push(harness.uninstall)

    await expect(AiAgentApi.pageInit()).rejects.toThrow('AI agent scene dictionary violates the contract')
  })
})
