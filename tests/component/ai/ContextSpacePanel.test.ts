/* eslint-disable vue/one-component-per-file */

import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/api/ai/context', () => ({
  AiContextApi: {
    spaces: {
      changeStatus: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const { default: ContextSpacePanel } = await import('@/views/Main/ai/context/components/ContextSpacePanel.vue')

const PassThrough = defineComponent({
  setup: (_, { slots }) => () => h('div', slots.default?.()),
})

const ElTableColumnStub = defineComponent({
  name: 'ElTableColumn',
  setup: () => () => null,
})

const ElTableStub = defineComponent({
  name: 'ElTable',
  setup: (_, { slots }) => () => h('div', { 'data-test': 'space-table' }, [
    slots.default?.(),
    h('div', { 'data-test': 'space-table-empty' }, slots.empty?.()),
  ]),
})

const ElEmptyStub = defineComponent({
  name: 'ElEmpty',
  setup: (_, { attrs }) => () => h('div', attrs),
})

describe('ContextSpacePanel', () => {
  it('renders the empty state once inside the table boundary', () => {
    const wrapper = mount(ContextSpacePanel, {
      props: {
        profiles: [],
        spaces: [],
        selectedProfileId: null,
        selectedSpaceId: null,
        loading: false,
      },
      global: {
        directives: { loading: () => undefined },
        stubs: {
          ContextSpaceDialog: true,
          ElButton: PassThrough,
          ElEmpty: ElEmptyStub,
          ElOption: PassThrough,
          ElSelect: PassThrough,
          ElTable: ElTableStub,
          ElTableColumn: ElTableColumnStub,
          ElTag: PassThrough,
        },
      },
    })

    expect(wrapper.findAllComponents(ElEmptyStub)).toHaveLength(1)
    expect(wrapper.get('[data-test="space-table-empty"]')
      .get('[data-test="context-spaces-empty"]')
      .exists()).toBe(true)
  })
})
