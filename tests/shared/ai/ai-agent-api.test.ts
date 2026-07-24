import { afterEach, describe, expect, it } from 'vitest'
import { AiAgentApi } from '@/api/ai/agents'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('AI agent API behavior', () => {
  it('accepts the current generation scene dictionary from page-init', async () => {
    const dict = {
      scene_arr: [
        { label: 'Chat', value: 'chat' },
        { label: 'Tool Generation', value: 'agent_generate' },
        { label: 'Text Generation', value: 'text_generate' },
        { label: 'Image Generation', value: 'image_generate' },
        { label: 'Video Generation', value: 'video_generate' },
        { label: 'Audio Generation', value: 'audio_generate' },
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
})
