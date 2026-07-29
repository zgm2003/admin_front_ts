/* eslint-disable vue/one-component-per-file */
import { defineComponent, h, nextTick, reactive } from 'vue'
import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiRunListParams } from '@/api/ai/runs'

const mocks = vi.hoisted(() => ({
  route: undefined as unknown as { path: string; query: Record<string, unknown> },
  push: vi.fn(),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))
vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({ push: mocks.push }),
}))

const { default: RunStats } = await import('@/views/Main/ai/runs/components/RunStats/index.vue')
const { default: RunPage } = await import('@/views/Main/ai/runs/index.vue')

const TabsStub = defineComponent({
  name: 'ElTabs',
  props: { modelValue: { type: String, required: true } },
  emits: ['update:modelValue'],
  setup(props, { slots }) {
    return () => h('div', { 'data-tab': props.modelValue }, slots.default?.())
  },
})

const PaneStub = defineComponent({
  name: 'ElTabPane',
  setup(_props, { slots }) {
    return () => h('section', slots.default?.())
  },
})

describe('AI run page URL navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.route = reactive({ path: '/ai/runs', query: { tab: 'stats' } })
    mocks.push.mockResolvedValue(undefined)
  })

  it('uses the URL tab as the source of truth and preserves browser history changes', async () => {
    const wrapper = shallowMount(RunPage, {
      global: {
        stubs: {
          ElTabs: TabsStub,
          ElTabPane: PaneStub,
          RunList: true,
          RunStats: true,
        },
      },
    })

    expect(wrapper.findComponent(TabsStub).props('modelValue')).toBe('stats')
    mocks.route.query.tab = 'list'
    await nextTick()
    expect(wrapper.findComponent(TabsStub).props('modelValue')).toBe('list')

    wrapper.findComponent(TabsStub).vm.$emit('update:modelValue', 'stats')
    await nextTick()
    expect(mocks.push).toHaveBeenCalledWith({
      path: '/ai/runs',
      query: { tab: 'stats' },
    })
    wrapper.unmount()
  })

  it('writes one complete stable list URL when the dashboard drills down', async () => {
    const wrapper = shallowMount(RunPage, {
      global: {
        stubs: {
          ElTabs: TabsStub,
          ElTabPane: PaneStub,
          RunList: true,
          RunStats: true,
        },
      },
    })
    const params: AiRunListParams = {
      date_start: '2026-07-23',
      date_end: '2026-07-29',
      platform: 'admin',
      model_id: 'gpt-5.5',
      provider_id: 3,
      billing_anomaly: 'state_inconsistent',
      anomaly_as_of: '2026-07-29T15:42:18+08:00',
    }

    wrapper.findComponent(RunStats).vm.$emit('drilldown', params)
    await nextTick()

    expect(mocks.push).toHaveBeenCalledTimes(1)
    expect(mocks.push).toHaveBeenCalledWith({
      path: '/ai/runs',
      query: {
        tab: 'list',
        date_start: '2026-07-23',
        date_end: '2026-07-29',
        platform: 'admin',
        model_id: 'gpt-5.5',
        provider_id: '3',
        billing_anomaly: 'state_inconsistent',
        anomaly_as_of: '2026-07-29T15:42:18+08:00',
      },
    })
    wrapper.unmount()
  })
})
