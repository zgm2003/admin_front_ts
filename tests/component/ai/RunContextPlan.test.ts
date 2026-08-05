import { readFileSync } from 'node:fs'
import { defineComponent, h, type PropType } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { AiRunContextPlan } from '@/api/ai/runs'
import RunContextPlan from '@/views/Main/ai/runs/components/RunList/RunContextPlan.vue'
import { contextOutcomeTagType } from '@/views/Main/ai/runs/components/RunList/context-plan'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

const plan = {
  id: 77,
  state: 'ready',
  retrieval_outcome: 'degraded',
  api_protocol: 'responses',
  token_counter_id: 'utf8_bytes_v1',
  policy_version: 'context-policy-v1',
  profile: null,
  budget: {
    context_window_tokens: 128000,
    effective_output_tokens: 4096,
    known_input_budget: 123904,
    known_input_upper_bound: 1200,
    policy_safety_margin: 0,
    proof: 'exact',
    provider_protocol_upper_bound: 0,
    tool_continuation_input_reserve: 0,
  },
  error: {
    stage: 'query_embedding',
    code: 'ai.context.embedding_unavailable',
    message: 'Embedding temporarily unavailable',
  },
  metrics: {},
  items: [],
} as AiRunContextPlan

const AppTableStub = defineComponent({
  name: 'AppTable',
  props: {
    data: { type: Array as PropType<AiRunContextPlan['items']>, default: () => [] },
    fixedFooter: Boolean,
    showRefresh: Boolean,
    showColumnSetting: Boolean,
  },
  setup: (_props, { slots }) => () => h('div', { class: 'app-table-stub' }, slots.default?.()),
})
const ElAlertStub = defineComponent({
  name: 'ElAlert',
  props: ['title', 'description', 'type'],
  template: '<div class="alert-stub" :data-type="type"><strong>{{ title }}</strong><span>{{ description }}</span></div>',
})
const PassThrough = defineComponent({ template: '<div><slot /></div>' })

function mountPlan(value: AiRunContextPlan = plan) {
  return mount(RunContextPlan, {
    props: { plan: value },
    global: {
      stubs: {
        AppTable: AppTableStub,
        Index: AppTableStub,
        ElAlert: ElAlertStub,
        ElDivider: PassThrough,
        ElTag: PassThrough,
        ElTable: PassThrough,
        ElTableColumn: PassThrough,
      },
    },
  })
}

describe('RunContextPlan', () => {
  it('maps degraded to warning and shows the persisted stage and stable code', async () => {
    expect(contextOutcomeTagType('degraded')).toBe('warning')
    const wrapper = mountPlan()
    const alert = wrapper.getComponent({ name: 'ElAlert' })

    expect(wrapper.text()).toContain('aiRuns.contextPlan.states.ready')
    expect(wrapper.text()).toContain('aiRuns.contextPlan.outcomes.degraded')
    expect(alert.props('type')).toBe('warning')
    expect(alert.props('title')).toContain('query_embedding')
    expect(alert.props('title')).toContain('ai.context.embedding_unavailable')

    await wrapper.setProps({ plan: { ...plan, state: 'failed', retrieval_outcome: 'failed' } })
    expect(wrapper.getComponent({ name: 'ElAlert' }).props('type')).toBe('error')
  })

  it('uses AppTable without local Element table or deep overrides', () => {
    const source = readFileSync('src/views/Main/ai/runs/components/RunList/RunContextPlan.vue', 'utf8')

    expect(source).toContain("import { AppTable } from '@/components/Table'")
    expect(source).toContain('<AppTable')
    expect(source).not.toContain('<el-table')
    expect(source).not.toContain(':deep')

    const wrapper = mountPlan()
    const table = wrapper.getComponent({ name: 'AppTable' })
    expect(table.props('fixedFooter')).toBe(false)
    expect(table.props('showRefresh')).toBe(false)
    expect(table.props('showColumnSetting')).toBe(false)
  })
})
