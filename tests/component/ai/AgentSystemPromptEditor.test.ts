// @vitest-environment happy-dom

import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  page: null as Record<string, unknown> | null,
}))

vi.mock('@/store/user', () => ({ useUserStore: () => ({ can: () => true }) }))
vi.mock('@/views/Main/ai/agents/use-agent-admin-page', () => ({
  useAgentAdminPage: () => mocks.page,
}))
vi.mock('@/components/AppDialog', () => ({
  AppDialog: defineComponent({ setup: (_, { slots }) => () => h('div', [slots.default?.(), slots.footer?.()]) }),
}))
vi.mock('@/components/Search', () => ({
  Search: defineComponent({ setup: () => () => null }),
}))
vi.mock('@/components/Table', () => ({
  AppTable: defineComponent({ setup: () => () => null }),
}))
vi.mock('@/components/UpMedia', () => ({
  UpMedia: defineComponent({ setup: () => () => null }),
}))
vi.mock('@/views/Main/ai/agents/components/AgentContextDialog.vue', () => ({
  default: defineComponent({ setup: () => () => null }),
}))
vi.mock('@/views/Main/ai/agents/components/AgentOfficialModelSummary.vue', () => ({
  default: defineComponent({ setup: () => () => null }),
}))
vi.mock('@/views/Main/ai/agents/components/AgentToolDialog/index.vue', () => ({
  default: defineComponent({ setup: () => () => null }),
}))

const { default: AgentPage } = await import('@/views/Main/ai/agents/index.vue')

const PassThrough = defineComponent({
  setup: (_, { slots }) => () => h('div', [slots.header?.(), slots.default?.(), slots.footer?.()]),
})

const ElInputStub = defineComponent({
  name: 'ElInput',
  inheritAttrs: false,
  props: {
    autosize: { type: [Boolean, Object], default: false },
    maxlength: { type: Number, default: undefined },
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    showWordLimit: Boolean,
    type: { type: String, default: 'text' },
  },
  setup: (props, { attrs }) => () => h('textarea', { ...attrs, value: props.modelValue }),
})

function pageState(systemPrompt: string) {
  const noop = vi.fn()
  return {
    t: (key: string) => key,
    isMobile: ref(false),
    dict: ref({ common_status_arr: [], scene_arr: [] }),
    searchForm: ref({}),
    searchFields: ref([]),
    columns: ref([]),
    listLoading: ref(false),
    listData: ref([]),
    page: ref({ currentPage: 1, pageSize: 20, total: 0 }),
    onSearch: noop,
    onPageChange: noop,
    refresh: noop,
    getList: noop,
    confirmDel: noop,
    toggleStatus: noop,
    dialogVisible: ref(true),
    dialogMode: ref('edit'),
    form: ref({
      avatar: '',
      billing_multiplier: '1',
      model_path: [],
      name: '客服助手',
      scenes: ['chat'],
      status: 1,
      system_prompt: systemPrompt,
    }),
    rules: ref({}),
    modelOptions: ref([]),
    toolDialogVisible: ref(false),
    toolAgent: ref(null),
    contextDialogVisible: ref(false),
    contextAgent: ref(null),
    selectedModel: ref(null),
    displayedCatalogRates: ref([]),
    onModelChange: noop,
    selectedModelRequiresChange: ref(false),
    modelCanUseTools: () => true,
    add: noop,
    edit: noop,
    openTools: noop,
    openContext: noop,
    testConnection: noop,
    confirmSubmit: noop,
    sceneText: () => '',
  }
}

describe('agent system prompt editor', () => {
  it('edits the raw Markdown source using the backend length limit', () => {
    const markdown = '# 角色\n\n## 规则\n- 只回答后台管理问题'
    mocks.page = pageState(markdown)

    const wrapper = mount(AgentPage, {
      global: {
        stubs: {
          AgentContextDialog: true,
          AgentOfficialModelSummary: true,
          AgentToolDialog: true,
          AppDialog: PassThrough,
          AppTable: true,
          ElAlert: true,
          ElAvatar: true,
          ElButton: true,
          ElCascader: true,
          ElCol: PassThrough,
          ElForm: PassThrough,
          ElFormItem: PassThrough,
          ElInput: ElInputStub,
          ElRow: PassThrough,
          ElSelectV2: true,
          ElTag: true,
          ElText: true,
          ElTooltip: PassThrough,
          Search: true,
          UpMedia: true,
        },
      },
    })

    const editor = wrapper.findAllComponents(ElInputStub).find(input => input.props('type') === 'textarea')
    expect(editor?.attributes('data-test')).toBe('system-prompt-editor')
    expect(editor?.props('modelValue')).toBe(markdown)
    expect(editor?.props('maxlength')).toBe(20_000)
    expect(editor?.props('showWordLimit')).toBe(true)
    expect(editor?.props('autosize')).toEqual({ minRows: 10, maxRows: 24 })
    expect(editor?.props('placeholder')).toBe('aiAgents.form.systemPromptPlaceholder')
  })
})
