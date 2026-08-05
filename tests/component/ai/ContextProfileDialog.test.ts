import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineComponent, h, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContextProfileDialog from '@/views/Main/ai/context/components/ContextProfileDialog.vue'
import { useContextWorkspace } from '@/views/Main/ai/context/use-context-workspace'

const apiMocks = vi.hoisted(() => ({
  pageInit: vi.fn(),
  profilesList: vi.fn(),
}))

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/api/ai/context', () => ({
  AiContextApi: {
    pageInit: apiMocks.pageInit,
    profiles: { list: apiMocks.profilesList },
    spaces: { list: vi.fn() },
    documents: { list: vi.fn(), versions: vi.fn() },
    evaluations: { run: vi.fn() },
  },
}))

const embeddingOptions = [{ value: 11, label: 'Embedding One', model_id: 'embed-1', provider_name: 'Provider A' }]
const memoryOptions = [{ value: 22, label: 'Memory One', model_id: 'memory-1', provider_name: 'Provider B' }]
const rerankerOptions = [{ value: 33, label: 'Reranker One', model_id: 'rerank-1', provider_name: 'Provider C' }]

const PassThrough = defineComponent({ template: '<div><slot /><slot name="footer" /></div>' })
const ElButtonStub = defineComponent({
  name: 'ElButton',
  inheritAttrs: false,
  props: { disabled: Boolean },
  emits: ['click'],
  template: '<button v-bind="$attrs" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
})
const ElInputStub = defineComponent({
  name: 'ElInput',
  inheritAttrs: false,
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">',
})
const ElSelectStub = defineComponent({
  name: 'ElSelect',
  inheritAttrs: false,
  props: ['modelValue', 'clearable', 'filterable'],
  emits: ['update:modelValue'],
  template: '<div v-bind="$attrs"><slot /></div>',
})
const ElOptionStub = defineComponent({
  name: 'ElOption',
  props: ['label', 'value'],
  template: '<span class="select-option" :data-value="value">{{ label }}</span>',
})

function mountDialog() {
  return mount(ContextProfileDialog, {
    props: {
      modelValue: true,
      profile: null,
      embeddingModelOptions: embeddingOptions,
      memoryModelOptions: memoryOptions,
      rerankerModelOptions: rerankerOptions,
    },
    global: {
      stubs: {
        ElDialog: PassThrough,
        ElForm: PassThrough,
        ElFormItem: PassThrough,
        ElRow: PassThrough,
        ElCol: PassThrough,
        ElButton: ElButtonStub,
        ElInput: ElInputStub,
        ElInputNumber: true,
        ElSelect: ElSelectStub,
        ElOption: ElOptionStub,
      },
    },
  })
}

describe('Context profile dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiMocks.pageInit.mockResolvedValue({
      embedding_model_options: embeddingOptions,
      memory_model_options: memoryOptions,
      reranker_model_options: rerankerOptions,
    })
    apiMocks.profilesList.mockResolvedValue({ items: [] })
  })

  it('loads Context Page Init once with the workspace and keeps each option set separate', async () => {
    let workspace: ReturnType<typeof useContextWorkspace> | undefined
    const Host = defineComponent({
      setup() {
        workspace = useContextWorkspace()
        return () => h('div')
      },
    })

    const wrapper = mount(Host)
    await flushPromises()

    expect(apiMocks.pageInit).toHaveBeenCalledTimes(1)
    expect(apiMocks.profilesList).toHaveBeenCalledTimes(1)
    expect(workspace?.embeddingModelOptions.value).toEqual(embeddingOptions)
    expect(workspace?.memoryModelOptions.value).toEqual(memoryOptions)
    expect(workspace?.rerankerModelOptions.value).toEqual(rerankerOptions)
    wrapper.unmount()
  })

  it('uses closed model selectors and submits their numeric option values', async () => {
    const wrapper = mountDialog()
    const embedding = wrapper.getComponent('[data-test="embedding-model-select"]')
    const memory = wrapper.getComponent('[data-test="memory-model-select"]')
    const reranker = wrapper.getComponent('[data-test="reranker-model-select"]')

    expect(embedding.text()).toContain('Embedding One')
    expect(embedding.text()).not.toContain('Reranker One')
    expect(memory.text()).toContain('Memory One')
    expect(memory.props('clearable')).toBe(true)
    expect(reranker.text()).toContain('Reranker One')
    expect(reranker.props('clearable')).toBe(true)
    expect(wrapper.get('[data-test="context-profile-submit"]').attributes('disabled')).toBeDefined()

    wrapper.getComponent('[data-test="context-profile-name"]').vm.$emit('update:modelValue', 'Production Profile')
    embedding.vm.$emit('update:modelValue', 11)
    memory.vm.$emit('update:modelValue', 22)
    reranker.vm.$emit('update:modelValue', 33)
    await nextTick()
    await wrapper.get('[data-test="context-profile-submit"]').trigger('click')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
      name: 'Production Profile',
      embedding_provider_model_id: 11,
      memory_provider_model_id: 22,
      reranker_provider_model_id: 33,
    })
  })

  it('uses a backend-registered token counter and no open-ended model input', () => {
    const source = readFileSync(resolve(
      process.cwd(),
      'src/views/Main/ai/context/components/ContextProfileDialog.vue',
    ), 'utf8')

    expect(source).toContain("embedding_token_counter_id: 'utf8_bytes_v1'")
    expect(source).not.toContain("embedding_token_counter_id: 'cl100k_base'")
    expect(source).not.toContain('allow-create')
    expect(source).not.toContain(':deep')
  })
})
