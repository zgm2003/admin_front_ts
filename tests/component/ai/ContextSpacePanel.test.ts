/* eslint-disable vue/one-component-per-file */

import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/i18n', () => ({
  default: { global: { t: (key: string) => key, tm: () => [] } },
}))
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

vi.mock('@/components/Table', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    AppTable: defineComponent({
      name: 'AppTableMock',
      props: {
        columns: { type: Array, default: () => [] },
        data: { type: Array, default: () => [] },
      },
      setup: (props, { slots }) => () => {
        const updatedColumn = (props.columns as Array<{
          prop?: string
          formatter?: (row: { updated_at: string }, column: { property: string }, value: string, index: number) => unknown
        }>).find((column) => column.prop === 'updated_at')
        return h('div', { 'data-test': 'space-table' }, [
          ...(props.data as Array<{ updated_at: string }>).map((row, index) => h(
            'div',
            { 'data-test': 'space-updated-at' },
            String(updatedColumn?.formatter?.(row, { property: 'updated_at' }, row.updated_at, index) ?? row.updated_at),
          )),
          h('div', { 'data-test': 'space-table-empty' }, slots.empty?.()),
        ])
      },
    }),
  }
})

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

  it('renders updated_at as a local date-time instead of the API ISO value', () => {
    const wrapper = mount(ContextSpacePanel, {
      props: {
        profiles: [],
        spaces: [{
          created_at: '2026-08-06T10:00:00.000+08:00',
          created_by: 1,
          platform: 'admin',
          id: 1,
          profile_id: 1,
          name: 'Local space',
          description: '',
          status: 'enabled',
          updated_at: '2026-08-06T10:12:54.629+08:00',
        }],
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
          ElTag: PassThrough,
        },
      },
    })

    const renderedTime = wrapper.get('[data-test="space-updated-at"]').text()
    expect(renderedTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    expect(renderedTime).not.toContain('T10:12:54.629+08:00')
  })
})
