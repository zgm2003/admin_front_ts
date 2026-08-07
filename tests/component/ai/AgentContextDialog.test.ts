import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AgentContextDialog from '@/views/Main/ai/agents/components/AgentContextDialog.vue'

/* eslint-disable vue/one-component-per-file */

const apiMocks = vi.hoisted(() => ({
  profilesList: vi.fn(),
  agentProfile: vi.fn(),
  agentSpaces: vi.fn(),
  spacesList: vi.fn(),
  updateProfile: vi.fn(),
  updateSpaces: vi.fn(),
}))

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('element-plus', () => ({ ElNotification: { success: vi.fn() } }))
vi.mock('@/api/ai/context', () => ({
  AiContextApi: {
    profiles: { list: apiMocks.profilesList },
    spaces: { list: apiMocks.spacesList },
    agents: {
      profile: apiMocks.agentProfile,
      spaces: apiMocks.agentSpaces,
      updateProfile: apiMocks.updateProfile,
      updateSpaces: apiMocks.updateSpaces,
    },
  },
}))

const PassThrough = defineComponent({ template: '<div><slot /><slot name="footer" /></div>' })
const ElButtonStub = defineComponent({
  props: { loading: Boolean, disabled: Boolean },
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
})
const ElSelectStub = defineComponent({
  props: {
    modelValue: { type: [Number, Array], default: undefined },
    multiple: Boolean,
    clearable: Boolean,
  },
  emits: ['update:modelValue'],
  template: '<div><slot /></div>',
})

const agent = { id: 7, name: 'gpt-5.6-sol' }
const profile = {
  id: 11,
  name: '硅基流动 Embedding',
  status: 'enabled',
  index_state: 'ready',
}
const space = {
  id: 21,
  platform: 'admin',
  profile_id: 11,
  name: '架构文档',
  description: '',
  status: 'enabled',
  created_by: 1,
  created_at: '2026-08-07T00:00:00Z',
  updated_at: '2026-08-07T00:00:00Z',
}

function mountDialog() {
  return mount(AgentContextDialog, {
    props: { modelValue: false, agent },
    global: {
      stubs: {
        ElDialog: PassThrough,
        ElForm: PassThrough,
        ElFormItem: PassThrough,
        ElButton: ElButtonStub,
        ElSelect: ElSelectStub,
        ElOption: true,
        ElAlert: true,
      },
      directives: { loading: {} },
    },
  })
}

describe('Agent context dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiMocks.profilesList.mockResolvedValue({ items: [profile] })
    apiMocks.agentProfile.mockResolvedValue({ profile_id: 11 })
    apiMocks.agentSpaces.mockResolvedValue({ space_ids: [21] })
    apiMocks.spacesList.mockResolvedValue({ items: [space] })
    apiMocks.updateProfile.mockImplementation(async (_agentID: number, profileID: number | null) => ({ profile_id: profileID }))
    apiMocks.updateSpaces.mockResolvedValue({ space_ids: [] })
  })

  it('treats Element Plus clear output as pure chat instead of querying every space', async () => {
    const wrapper = mountDialog()
    await wrapper.setProps({ modelValue: true })
    await flushPromises()

    const profileSelect = wrapper.findAllComponents(ElSelectStub)[0]
    profileSelect.vm.$emit('update:modelValue', undefined)
    await flushPromises()

    expect(apiMocks.spacesList).toHaveBeenCalledTimes(1)
    expect(apiMocks.spacesList).toHaveBeenLastCalledWith({ profile_id: 11, status: 'enabled' })

    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')
    await flushPromises()

    expect(apiMocks.updateProfile).toHaveBeenCalledWith(7, null)
    expect(apiMocks.updateSpaces).not.toHaveBeenCalled()
  })
})
