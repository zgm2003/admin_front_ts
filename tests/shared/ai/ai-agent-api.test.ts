import { afterEach, describe, expect, it } from 'vitest'
import { AiAgentApi } from '@/api/ai/agents'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('AI agent API behavior', () => {
  it('accepts the current generation scene dictionary from page-init', async () => {
    const dict = {
      billing_multiplier_default: '1',
      max_output_tokens_default: 4096,
      scene_arr: [
        { label: 'Chat', value: 'chat' },
        { label: 'Tool Generation', value: 'agent_generate' },
        { label: 'Text Generation', value: 'text_generate' },
        { label: 'Image Generation', value: 'image_generate' },
      ],
      common_status_arr: [
        { label: 'Enabled', value: 1 },
        { label: 'Disabled', value: 2 },
      ],
      provider_options: [
        { label: 'test', value: 10, engine_type: 'openai' },
      ],
      provider_model_options: [
        {
          label: 'gpt-5.4',
          value: 'gpt-5.4',
          provider_id: 10,
          model_id: 'gpt-5.4',
          display_name: 'gpt-5.4',
          billing_multiplier: '1',
          max_output_tokens: 4096,
        },
      ],
    }
    const harness = installApiClientHarness({ dict })
    cleanups.push(harness.uninstall)

    await expect(AiAgentApi.pageInit()).resolves.toEqual({ dict })
    expect(harness.requests.map(({ method, path }) => [method, path])).toEqual([
      ['GET', '/api/admin/v1/ai-agents/page-init'],
    ])
  })

  it.each(['video_generate', 'audio_generate'])('rejects retired scene %s from page-init', async (scene) => {
    const harness = installApiClientHarness({
      dict: {
        billing_multiplier_default: '1',
        max_output_tokens_default: 4096,
        scene_arr: [{ label: 'Retired', value: scene }],
        common_status_arr: [{ label: 'Enabled', value: 1 }],
        provider_options: [],
        provider_model_options: [],
      },
    })
    cleanups.push(harness.uninstall)

    await expect(AiAgentApi.pageInit()).rejects.toThrow('AI agent scene dictionary violates the contract')
  })
})
