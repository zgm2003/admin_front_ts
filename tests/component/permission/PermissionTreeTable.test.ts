import { computed, defineComponent, inject, provide } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PermissionTreeTable from '@/views/Main/permission/permission/components/PermissionTreeTable.vue'

const table = vi.hoisted(() => ({
  toggleRowSelection: vi.fn(),
  toggleRowExpansion: vi.fn(),
}))

// eslint-disable-next-line vue/one-component-per-file
const ElTableStub = defineComponent({
  name: 'ElTable',
  props: { data: { type: Array, required: true } },
  emits: ['row-click', 'selection-change'],
  setup(props, { expose }) {
    provide('permission-row', computed(() => props.data[0]))
    expose({
      toggleRowSelection: table.toggleRowSelection,
      toggleRowExpansion: table.toggleRowExpansion,
    })
    return {}
  },
  template: '<div data-testid="table" @click="$emit(\'row-click\', data[0])"><slot /></div>',
})

// eslint-disable-next-line vue/one-component-per-file
const ElTableColumnStub = defineComponent({
  name: 'ElTableColumn',
  setup() {
    return { row: inject('permission-row') }
  },
  template: '<div><slot :row="row" /></div>',
})

// eslint-disable-next-line vue/one-component-per-file
const ElSwitchStub = defineComponent({
  name: 'ElSwitch',
  props: { modelValue: { type: Number, default: 0 } },
  emits: ['click', 'change', 'update:modelValue'],
  template: '<button data-testid="status-switch" @click="$emit(\'click\', $event)">status</button>',
})

const labels = {
  id: 'id', name: 'name', icon: 'icon', status: 'status', sort: 'sort',
  type: 'type', actions: 'actions', add: 'add', edit: 'edit',
}

describe('PermissionTreeTable', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not turn a status-switch click into row selection', async () => {
    const row = {
      id: 5,
      name: 'Users',
      icon: '',
      status: 1,
      sort: 1,
      type: 2,
      type_name: 'Page',
      children: [],
    }
    const wrapper = mount(PermissionTreeTable, {
      props: {
        rows: [row] as never,
        loading: false,
        expanded: false,
        canAdd: true,
        canEdit: true,
        canStatus: true,
        labels,
      },
      global: {
        directives: { loading: () => undefined },
        stubs: {
          ElTable: ElTableStub,
          ElTableColumn: ElTableColumnStub,
          ElSwitch: ElSwitchStub,
          ElButton: true,
          ElTag: true,
          DIcon: true,
        },
      },
    })

    await wrapper.get('[data-testid="status-switch"]').trigger('click')
    expect(table.toggleRowSelection).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="table"]').trigger('click')
    expect(table.toggleRowSelection).toHaveBeenCalledWith(row)
  })
})
