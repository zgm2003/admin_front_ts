import { mount } from '@vue/test-utils'
import { defineComponent, h, type PropType } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import type { ProviderModelDraft } from '@/views/Main/ai/providers/composables/useProviderForm'
import ProviderModelEditor from '@/views/Main/ai/providers/components/ProviderModelEditor.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const AppTableStub = defineComponent({
  name: 'AppTable',
  props: {
    data: { type: Array as PropType<ProviderModelDraft[]>, default: () => [] },
    fixedFooter: Boolean,
    showRefresh: Boolean,
    showColumnSetting: Boolean,
  },
  setup(props, { slots }) {
    return () => h('div', { class: 'app-table-stub' }, [
      slots['toolbar-right']?.(),
      ...props.data.map((row, index) => h('div', { class: 'model-row' }, [
        slots['cell-model_id']?.({ row, index }),
        slots['cell-display_name']?.({ row, index }),
        slots['cell-model_kind']?.({ row, index }),
        slots['cell-status']?.({ row, index }),
        slots['cell-actions']?.({ row, index }),
      ])),
    ])
  },
})

const ElButtonStub = defineComponent({
  name: 'ElButton',
  emits: ['click'],
  setup(_, { attrs, emit, slots }) {
    return () => h('button', { ...attrs, onClick: () => emit('click') }, slots.default?.())
  },
})

const ElSelectStub = defineComponent({
  name: 'ElSelect',
  props: ['modelValue', 'options'],
  emits: ['update:modelValue'],
  template: '<div class="select-stub" />',
})

const commonStubs = {
  AppTable: AppTableStub,
  Index: AppTableStub,
  ElButton: ElButtonStub,
  ElInput: true,
  ElOption: true,
  ElSelect: ElSelectStub,
  ElSwitch: true,
  ElTooltip: { template: '<span><slot /></span>' },
}

const initialRows: ProviderModelDraft[] = [{
  model_id: 'embed-v1',
  model_kind: 'embedding',
  display_name: 'Embedding',
  status: 2,
}]

describe('ProviderModelEditor', () => {
  it('uses AppTable and stock controls without local table or deep overrides', () => {
    const source = readFileSync('src/views/Main/ai/providers/components/ProviderModelEditor.vue', 'utf8')
    expect(source).toContain("import { AppTable } from '@/components/Table'")
    expect(source).toContain('<AppTable')
    expect(source).not.toContain('<el-table')
    expect(source).not.toContain(':deep')

    const wrapper = mount(ProviderModelEditor, {
      props: { modelValue: initialRows },
      global: { stubs: commonStubs },
    })
    const table = wrapper.getComponent({ name: 'AppTable' })
    expect(table.props('fixedFooter')).toBe(false)
    expect(table.props('showRefresh')).toBe(false)
    expect(table.props('showColumnSetting')).toBe(false)
    expect(wrapper.getComponent({ name: 'ElSelect' }).props('options')).toEqual([
      { label: 'aiProviders.modelKinds.chat', value: 'chat' },
      { label: 'aiProviders.modelKinds.embedding', value: 'embedding' },
      { label: 'aiProviders.modelKinds.rerank', value: 'rerank' },
    ])
  })

  it('adds an explicit Chat row through a v-model update', async () => {
    const wrapper = mount(ProviderModelEditor, {
      props: { modelValue: initialRows },
      global: { stubs: commonStubs },
    })

    await wrapper.get('[data-test="add-provider-model"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([
      ...initialRows,
      { model_id: '', model_kind: 'chat', display_name: '', status: 1 },
    ])
  })

  it('removes a row through a v-model update', async () => {
    const wrapper = mount(ProviderModelEditor, {
      props: { modelValue: initialRows },
      global: { stubs: commonStubs },
    })

    await wrapper.get('[data-test="remove-provider-model"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([])
  })
})
