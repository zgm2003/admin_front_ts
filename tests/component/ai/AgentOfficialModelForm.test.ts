// @vitest-environment happy-dom

import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AgentOfficialModelSummary from '@/views/Main/ai/agents/components/AgentOfficialModelSummary.vue'
import {
  modelCanUseTools,
  modelRequiresChange,
  selectableProviderModels,
} from '@/views/Main/ai/agents/use-agent-admin-page'
import { selectableAgentTools } from '@/views/Main/ai/agents/components/AgentToolDialog/tool-options'

vi.mock('vue-i18n', async (importOriginal) => ({
  ...await importOriginal<typeof import('vue-i18n')>(),
  useI18n: () => ({ t: (key: string) => key }),
}))
const PassThrough = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) })

function model(lifecycle: 'active' | 'deprecated' | 'retired', tools = true) {
  return {
    billing_multiplier: '1', catalog_model_id: 'gpt-5.4', catalog_rates: [], catalog_vendor: 'openai',
    catalog_version: 'official_models_v1', context_tier_threshold_tokens: 272000, display_name: 'GPT 5.4',
    label: 'GPT 5.4', model_id: `provider-${lifecycle}`, override_version: 0, price_source: 'official',
    price_source_url: 'https://openai.com/pricing', price_verified_at: '2026-07-27', pricing_version: 'official_models_v1',
    provider_id: 10, value: `provider-${lifecycle}`,
    official_model: {
      model_id: 'gpt-5.4', catalog_version: 'official_models_v1', catalog_vendor: 'openai', model_family: 'gpt',
      lifecycle_status: lifecycle, context_window_tokens: 1_050_000, max_output_tokens: 128_000,
    },
    capabilities: {
      input_modalities: ['text', 'image'], output_modalities: ['text'], supports_tools: tools,
      supports_streaming: true, supports_structured_output: false,
      runtime_parameters: {
        temperature: { supported: true, default: 1, min: 0, max: 2 },
        max_history: { supported: true, default: 20, min: 1, max: 50, transitional: true },
      },
      attachments: {
        image: { enabled: true, mime_types: ['image/png'], max_files: 5, max_file_bytes: 10_485_760 },
        native_file: { enabled: false },
      },
    },
  }
}

describe('agent official model form', () => {
  it('lists only active official models for a new selection', () => {
    expect(selectableProviderModels([model('active'), model('deprecated'), model('retired')]).map((item) => item.model_id))
      .toEqual(['provider-active'])
  })

  it('keeps deprecated binding as a readonly warning and blocks retired binding until changed', () => {
    expect(modelRequiresChange(model('deprecated'))).toBe(false)
    expect(modelRequiresChange(model('retired'))).toBe(true)

    const wrapper = mount(AgentOfficialModelSummary, {
      props: { model: model('deprecated'), rates: [], multiplier: '1', mobile: false },
      global: { stubs: { ElDescriptions: PassThrough, ElDescriptionsItem: PassThrough, ElTable: PassThrough, ElTableColumn: PassThrough, ElTag: PassThrough } },
    })
    expect(wrapper.find('[data-test="lifecycle-deprecated"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('1050000')
    expect(wrapper.text()).toContain('128000')
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('gates tools using effective capabilities', () => {
    expect(modelCanUseTools(model('active', true))).toBe(true)
    expect(modelCanUseTools(model('active', false))).toBe(false)
  })

  it('offers only enabled low-risk tools for agent binding', () => {
    const tools = [
      { id: 1, status: 1, risk_level: 'low' },
      { id: 2, status: 2, risk_level: 'low' },
      { id: 3, status: 1, risk_level: 'medium' },
      { id: 4, status: 1, risk_level: 'high' },
    ] as const

    expect(selectableAgentTools(tools).map((tool) => tool.id)).toEqual([1])
  })
})
