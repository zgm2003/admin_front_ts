import { afterEach, describe, expect, it } from 'vitest'
import { AiProviderApi } from '@/api/ai/providers'
import {
  buildProviderMutationParams,
  createDefaultProviderForm,
  createProviderEditForm,
} from '@/views/Main/ai/providers/composables/useProviderForm'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('AI provider API protocol', () => {
  it('defaults to Chat Completions and preserves an explicit Responses selection', () => {
    const form = createDefaultProviderForm()
    expect(form.api_protocol).toBe('chat_completions')

    form.api_protocol = 'responses'
    form.name = 'OpenAI'
    form.api_key = 'sk-test'
    form.model_ids = ['gpt-5.6']
    const params = buildProviderMutationParams(form)
    expect(params).toMatchObject({
      api_protocol: 'responses',
    })
    expect(params).not.toHaveProperty('file_input_mode')
  })

  it('preserves the current protocol when preparing an existing provider for editing', () => {
    const form = createProviderEditForm({
      id: 7,
      name: 'OpenAI',
      engine_type: 'openai',
      base_url: 'https://api.openai.com/v1',
      status: 1,
      api_protocol: 'responses',
    } as Parameters<typeof createProviderEditForm>[0], [{
      model_id: 'gpt-5.6',
      display_name: 'GPT-5.6',
    }])

    expect(form.api_protocol).toBe('responses')
  })

  it('accepts the closed API protocol dictionary from page-init', async () => {
    const dict = {
      engine_type_arr: [{ label: 'OpenAI', value: 'openai' }],
      api_protocol_arr: [
        { label: 'Chat Completions', value: 'chat_completions' },
        { label: 'Responses API', value: 'responses' },
      ],
      common_status_arr: [{ label: 'Enabled', value: 1 }, { label: 'Disabled', value: 2 }],
      health_status_arr: [{ label: 'Unknown', value: 'unknown' }],
      model_sync_arr: [{ label: 'Unknown', value: 'unknown' }],
    }
    const harness = installApiClientHarness({ dict })
    cleanups.push(harness.uninstall)

    await expect(AiProviderApi.pageInit()).resolves.toEqual({ dict })
  })

  it('sends only api_protocol in provider mutations', async () => {
    const harness = installApiClientHarness({ id: 41 })
    cleanups.push(harness.uninstall)

    await AiProviderApi.create({
      name: 'OpenAI',
      engine_type: 'openai',
      base_url: 'https://api.openai.com/v1',
      api_key: 'sk-test',
      model_ids: ['gpt-5.6'],
      status: 1,
      api_protocol: 'responses',
    })

    expect(harness.requests[0]?.body).toMatchObject({ api_protocol: 'responses' })
    expect(harness.requests[0]?.body).not.toHaveProperty('file_input_mode')
  })
})
