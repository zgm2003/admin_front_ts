import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AppTable from '@/components/Table/src/index.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/hooks/useResponsive', () => ({ useIsMobile: () => ({ value: false }) }))
vi.mock('@/shared/accessibility/announcer', () => ({
  announcePolite: vi.fn(),
  announceAssertive: vi.fn(),
}))

const ElTableStub = defineComponent({
  name: 'ElTable',
  setup(_props, { slots }) {
    return () => h('table', h('tbody', slots.default?.()))
  },
})

const ElTableColumnStub = defineComponent({
  name: 'ElTableColumn',
  setup(_props, { slots }) {
    return () => h('tr', [
      h('td', { 'data-test': 'column-registration' }, slots.default?.({
        row: {},
        column: {},
        $index: -1,
      })),
      h('td', { 'data-test': 'real-cell' }, slots.default?.({
        row: { id: 1, items: ['pdf'] },
        column: {},
        $index: 0,
      })),
    ])
  },
})

describe('AppTable cell slot boundary', () => {
  it('does not expose the Element Plus column-registration placeholder as a business row', () => {
    const indexes: number[] = []
    const wrapper = mount(AppTable, {
      props: {
        columns: [{ key: 'items', label: 'Items' }],
        data: [{ id: 1, items: ['pdf'] }],
      },
      slots: {
        'cell-items': ({ row, index }: { row: { items?: string[] }; index: number }) => {
          indexes.push(index)
          return h('span', row.items?.join(','))
        },
      },
      global: {
        stubs: {
          ElTable: ElTableStub,
          ElTableColumn: ElTableColumnStub,
          ElPagination: true,
          ElSpace: { template: '<div><slot /></div>' },
          TableActions: true,
          ColumnSetting: true,
        },
        directives: { loading: () => undefined },
      },
    })

    expect(indexes).toEqual([0])
    expect(wrapper.get('[data-test="column-registration"]').text()).toBe('')
    expect(wrapper.get('[data-test="real-cell"]').text()).toBe('pdf')
  })
})
