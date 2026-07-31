import { describe, expect, it } from 'vitest'
import {
  buildProviderMutationParams,
  createDefaultProviderForm,
  createProviderEditForm,
} from '@/views/Main/ai/providers/composables/useProviderForm'

describe('provider file input mode', () => {
  it('defaults to disabled and preserves an explicit Chat Completions selection', () => {
    const form = createDefaultProviderForm()
    expect(form.file_input_mode).toBe('disabled')

    form.file_input_mode = 'chat_completions'
    form.name = 'OpenAI'
    form.api_key = 'sk-test'
    form.model_ids = ['gpt-5.6']
    expect(buildProviderMutationParams(form)).toMatchObject({
      file_input_mode: 'chat_completions',
    })
  })

  it('preserves the current mode when preparing an existing provider for editing', () => {
    const form = createProviderEditForm({
      id: 7,
      name: 'OpenAI',
      engine_type: 'openai',
      base_url: 'https://api.openai.com/v1',
      status: 1,
      file_input_mode: 'chat_completions',
    } as Parameters<typeof createProviderEditForm>[0], [{
      model_id: 'gpt-5.6',
      display_name: 'GPT-5.6',
    }])

    expect(form.file_input_mode).toBe('chat_completions')
  })
})
