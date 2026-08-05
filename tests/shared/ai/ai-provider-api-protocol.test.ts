import { afterEach, describe, expect, it } from 'vitest'
import { AiProviderApi } from '@/api/ai/providers'
import {
  buildProviderMutationParams,
  createDefaultProviderForm,
  createProviderEditForm,
  mergeProviderModelCandidates,
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
    form.models = [{
      model_id: 'gpt-5.6',
      model_kind: 'chat',
      display_name: 'GPT-5.6',
      status: 1,
    }]
    const params = buildProviderMutationParams(form)
    expect(params).toMatchObject({
      api_protocol: 'responses',
      models: [{ model_id: 'gpt-5.6', model_kind: 'chat' }],
      model_display_names: { 'gpt-5.6': 'GPT-5.6' },
      statuses: { 'gpt-5.6': 1 },
    })
    expect(params).not.toHaveProperty('model_ids')
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
      model_kind: 'embedding',
      display_name: 'GPT-5.6',
      status: 2,
    }])

    expect(form.api_protocol).toBe('responses')
    expect(form.models).toEqual([{
      model_id: 'gpt-5.6',
      model_kind: 'embedding',
      display_name: 'GPT-5.6',
      status: 2,
    }])
  })

  it('merges remote candidates by exact model ID without retyping existing rows', () => {
    const existing = [{
      model_id: 'embed-v1',
      model_kind: 'embedding' as const,
      display_name: 'Custom Embedding',
      status: 2 as const,
    }]

    expect(mergeProviderModelCandidates(existing, [
      { model_id: 'embed-v1', display_name: 'Remote Name' },
      { model_id: 'chat-v1', display_name: 'Remote Chat' },
    ])).toEqual([
      existing[0],
      { model_id: 'chat-v1', model_kind: 'chat', display_name: 'Remote Chat', status: 1 },
    ])
  })

  it('rejects blank and duplicate model IDs before serialization', () => {
    const form = createDefaultProviderForm()
    form.models = [{ model_id: ' ', model_kind: 'chat', display_name: '', status: 1 }]
    expect(() => buildProviderMutationParams(form)).toThrow(/model id/i)

    form.models = [
      { model_id: 'same', model_kind: 'chat', display_name: '', status: 1 },
      { model_id: 'same', model_kind: 'embedding', display_name: '', status: 2 },
    ]
    expect(() => buildProviderMutationParams(form)).toThrow(/duplicate/i)
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

  it('sends typed models, display names and statuses without legacy model_ids', async () => {
    const harness = installApiClientHarness({ id: 41 })
    cleanups.push(harness.uninstall)

    await AiProviderApi.create({
      name: 'OpenAI',
      engine_type: 'openai',
      base_url: 'https://api.openai.com/v1',
      api_key: 'sk-test',
      models: [{ model_id: 'gpt-5.6', model_kind: 'chat' }],
      model_display_names: { 'gpt-5.6': 'GPT-5.6' },
      statuses: { 'gpt-5.6': 1 },
      status: 1,
      api_protocol: 'responses',
    })

    expect(harness.requests[0]?.body).toMatchObject({
      api_protocol: 'responses',
      models: [{ model_id: 'gpt-5.6', model_kind: 'chat' }],
      model_display_names: { 'gpt-5.6': 'GPT-5.6' },
      statuses: { 'gpt-5.6': 1 },
    })
    expect(harness.requests[0]?.body).not.toHaveProperty('model_ids')
    expect(harness.requests[0]?.body).not.toHaveProperty('file_input_mode')
  })
})
