// @vitest-environment happy-dom

import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import RunLatencyBreakdown from '@/views/Main/ai/runs/components/RunList/RunLatencyBreakdown.vue'
import RunLatencyStatsTable from '@/views/Main/ai/runs/components/RunStats/RunLatencyStatsTable.vue'

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

describe('AI run provider latency statistics', () => {
  it('renders P50 P95 P99, sample counts and sample quality', () => {
    const wrapper = mount(RunLatencyStatsTable, {
      props: {
        rows: [{
          provider_id: 3,
          provider_name: 'Primary Provider',
          model_id: 'gpt-test',
          ttft: { sample_count: 25, insufficient_sample: false, p50_ms: 90, p95_ms: 180, p99_ms: 220 },
          provider_total: { sample_count: 12, insufficient_sample: true, p50_ms: 900, p95_ms: 1800, p99_ms: 2200 },
        }],
      },
      global: { stubs: { ElTag: PassThrough, ElEmpty: true } },
    })

    const row = wrapper.get('[data-test="latency-stats-row"]')
    expect(row.text()).toContain('Primary Provider')
    expect(row.text()).toContain('gpt-test')
    expect(row.text()).toContain('90 ms')
    expect(row.text()).toContain('180 ms')
    expect(row.text()).toContain('2,200 ms')
    expect(row.text()).toContain('25')
    expect(row.text()).toContain('12')
    expect(row.text()).toContain('aiRuns.stats.insufficientSample')
  })

  it('does not present empty percentile zero values as measurements', () => {
    const emptyDistribution = {
      sample_count: 0,
      insufficient_sample: true,
      p50_ms: 0,
      p95_ms: 0,
      p99_ms: 0,
    }
    const wrapper = mount(RunLatencyStatsTable, {
      props: {
        rows: [{
          provider_id: 3,
          provider_name: 'Provider',
          model_id: 'model',
          ttft: emptyDistribution,
          provider_total: emptyDistribution,
        }],
      },
      global: { stubs: { ElTag: PassThrough, ElEmpty: true } },
    })

    expect(wrapper.get('[data-test="latency-stats-row"]').text()).not.toContain('0 ms')
  })
})
