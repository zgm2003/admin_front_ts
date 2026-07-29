// @vitest-environment happy-dom

import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import RunLatencyBreakdown from '@/views/Main/ai/runs/components/RunList/RunLatencyBreakdown.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

const PassThrough = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h('span', attrs, slots.default?.())
  },
})

const latency = {
  accept_ms: 12,
  queue_ms: 80,
  prepare_ms: 40,
  ttft_ms: 350,
  provider_total_ms: 900,
  settlement_ms: 30,
  end_to_end_ms: 1080,
  claim_source: 'wake' as const,
}

const requestSummary = {
  provider_attempt_count: 2,
  tool_call_count: 1,
  prepared_request_bytes: 491,
  message_count: 3,
}

describe('AI run latency breakdown', () => {
  it('renders queue, prepare, TTFT, provider, settlement and safe request facts', () => {
    const wrapper = mount(RunLatencyBreakdown, {
      props: { latency, requestSummary },
      global: { stubs: { ElTag: PassThrough } },
    })

    expect(wrapper.get('[data-latency-stage="queue"]').text()).toContain('80 ms')
    expect(wrapper.get('[data-latency-stage="prepare"]').text()).toContain('40 ms')
    expect(wrapper.get('[data-latency-stage="ttft"]').text()).toContain('350 ms')
    expect(wrapper.get('[data-latency-stage="provider-total"]').text()).toContain('900 ms')
    expect(wrapper.get('[data-latency-stage="settlement"]').text()).toContain('30 ms')
    expect(wrapper.get('[data-test="request-summary"]').text()).toContain('491')
    expect(wrapper.get('[data-test="request-summary"]').text()).toContain('3')
    expect(wrapper.text()).not.toContain('prepared_request_json')
  })

  it('shows unavailable instead of zero for missing timestamps', () => {
    const wrapper = mount(RunLatencyBreakdown, {
      props: {
        latency: {
          accept_ms: null,
          queue_ms: null,
          prepare_ms: null,
          ttft_ms: null,
          provider_total_ms: null,
          settlement_ms: null,
          end_to_end_ms: null,
          claim_source: '',
        },
        requestSummary: { ...requestSummary, message_count: null },
      },
      global: { stubs: { ElTag: PassThrough } },
    })

    const values = wrapper.findAll('[data-test="latency-value"]')
    expect(values).toHaveLength(7)
    expect(values.every((value) => value.text() === '-')).toBe(true)
    expect(wrapper.text()).not.toContain('0 ms')
  })
})
