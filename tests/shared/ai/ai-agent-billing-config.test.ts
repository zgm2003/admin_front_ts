import { afterEach, describe, expect, it } from 'vitest'
import { AiAgentApi } from '@/api/ai/agents'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('AI agent billing configuration contract', () => {
  it('keeps generated pricing defaults and official catalog metadata from page-init', async () => {
    const dict = {
      billing_multiplier_default: '1.25',
      max_output_tokens_default: 4096,
      scene_arr: [{ label: 'Chat', value: 'chat' }],
      common_status_arr: [{ label: 'Enabled', value: 1 }],
      provider_options: [{ label: 'Gateway', value: 10, engine_type: 'openai' }],
      provider_model_options: [{
        billing_multiplier: '1.125',
        catalog_model_id: 'gpt-5.4-2026-07-01',
        catalog_rates: [{
          category: 'input',
          price: '0.00000125',
          tier_key: '',
          unit: 'token',
          unit_scale: 1,
        }],
        catalog_vendor: 'openai',
        catalog_version: '2026-07-01',
        display_name: 'GPT 5.4',
        label: 'GPT 5.4',
        max_output_tokens: 8192,
        model_id: 'gpt-5.4',
        provider_id: 10,
        value: 'gpt-5.4',
      }],
    }
    const harness = installApiClientHarness({ dict })
    cleanups.push(harness.uninstall)

    await expect(AiAgentApi.pageInit()).resolves.toEqual({ dict })
  })

  it('sends multiplier as a decimal string and max output as the generated integer field', async () => {
    const harness = installApiClientHarness({ id: 41 })
    cleanups.push(harness.uninstall)
    const payload = {
      name: 'Priced agent',
      provider_id: 10,
      model_id: 'gpt-5.4',
      scenes: ['chat'] as Array<'chat'>,
      status: 1 as const,
      system_prompt: 'Be concise.',
      avatar: '',
      billing_multiplier: '1.375',
      max_output_tokens: 6144,
    }

    await AiAgentApi.create(payload)
    harness.respondWith({})
    await AiAgentApi.update({ ...payload, id: 41 })

    expect(harness.requests.map(({ body }) => body)).toEqual([
      payload,
      payload,
    ])
  })
})
