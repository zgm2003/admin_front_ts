// @vitest-environment happy-dom

import { nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { AiAgentEffectiveCapabilities } from '@/api/ai/agents'
import MessageInput from '@/views/Main/ai/chat/components/MessageInput/index.vue'
import RuntimeParamsPanel from '@/views/Main/ai/chat/components/MessageInput/RuntimeParamsPanel.vue'
import { createRuntimeParams } from '@/views/Main/ai/chat/components/MessageInput/runtime-params'

vi.mock('vue-i18n', async (importOriginal) => ({
  ...await importOriginal<typeof import('vue-i18n')>(),
  useI18n: () => ({ t: (key: string) => key }),
}))
vi.mock('@/hooks/useResponsive', () => ({ useIsMobile: () => ref(false) }))
vi.mock('@/components/DIcon', () => ({ DIcon: { template: '<i />' } }))
vi.mock('@/components/EmojiPicker', () => ({ EmojiPicker: { template: '<div />' } }))
vi.mock('@/views/Main/ai/chat/components/MessageInput/use-speech-input', () => ({
  useSpeechInput: () => ({ isRecording: ref(false), toggleVoiceInput: vi.fn() }),
}))

function capabilities(temperatureSupported = true): AiAgentEffectiveCapabilities {
  return {
    input_modalities: ['text'], output_modalities: ['text'], supports_tools: false,
    supports_streaming: true, supports_structured_output: false,
    runtime_parameters: {
      temperature: { supported: temperatureSupported, default: 0.7, min: 0.2, max: 1.4 },
      max_history: { supported: true, default: 12, min: 2, max: 30, transitional: true },
    },
    attachments: {
      image: { enabled: false, mime_types: [], max_files: 0, max_file_bytes: 0 },
      native_file: { enabled: false },
    },
  }
}

const SwitchStub = {
  inheritAttrs: false,
  props: { modelValue: Boolean },
  emits: ['update:modelValue'],
  template: `
    <input
      type="checkbox"
      :checked="modelValue"
      v-bind="$attrs"
      @change="$emit('update:modelValue', $event.target.checked)"
    >
  `,
}

const ButtonStub = {
  inheritAttrs: false,
  emits: ['click'],
  template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
}

describe('chat runtime parameters', () => {
  it('never constructs max_tokens and submits only enabled overrides', () => {
    expect(createRuntimeParams({
      temperature: { enabled: false, value: 0.7 },
      maxHistory: { enabled: false, value: 12 },
    })).toEqual({})

    const params = createRuntimeParams({
      temperature: { enabled: true, value: 0.4 },
      maxHistory: { enabled: true, value: 8 },
    })
    expect(params).toEqual({ temperature: 0.4, max_history: 8 })
    expect(JSON.stringify(params)).not.toContain('max_tokens')
  })

  it('hides unsupported temperature and marks max_history as transitional', () => {
    const wrapper = mount(RuntimeParamsPanel, {
      props: {
        capabilities: capabilities(false),
        hasCustomParams: false,
        temperature: { enabled: false, value: 0.7 },
        maxHistory: { enabled: false, value: 12 },
      },
      global: {
        stubs: {
          ElIcon: { template: '<i><slot /></i>' },
          ElSlider: true,
          ElSwitch: SwitchStub,
          ElTag: { template: '<span><slot /></span>' },
        },
      },
    })

    expect(wrapper.find('[data-test="temperature-param"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="max-history-param"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('aiChat.transitionalParam')
    expect(wrapper.text()).not.toContain('aiChat.maxTokens')
  })

  it('restores server defaults when the conversation changes', async () => {
    const wrapper = mount(MessageInput, {
      props: {
        sending: false,
        agentId: 1,
        conversationId: 10,
        capabilities: capabilities(true),
      },
      global: {
        stubs: {
          DIcon: true,
          EmojiPicker: true,
          ElButton: ButtonStub,
          ElIcon: { template: '<i><slot /></i>' },
          ElPopover: { template: '<div><slot name="reference" /></div>' },
          ElSlider: true,
          ElSwitch: SwitchStub,
          ElTag: { template: '<span><slot /></span>' },
          PendingAttachments: true,
        },
      },
    })

    await wrapper.get('button[aria-label="aiChat.runtimeParams"]').trigger('click')
    await wrapper.get('[data-test="temperature-enabled"]').setValue(true)
    expect((wrapper.vm as unknown as { getRequestParams: () => object }).getRequestParams()).toEqual({ temperature: 0.7 })

    await wrapper.setProps({ conversationId: 11 })
    await nextTick()
    expect((wrapper.vm as unknown as { getRequestParams: () => object }).getRequestParams()).toEqual({})
  })

  it('hides every image action for a text-only agent', () => {
    const wrapper = mount(MessageInput, {
      props: { sending: false, agentId: 1, capabilities: capabilities(false) },
      global: {
        stubs: {
          ElButton: ButtonStub,
          ElIcon: { template: '<i><slot /></i>' },
          ElPopover: { template: '<div><slot name="reference" /></div>' },
        },
      },
    })

    expect(wrapper.find('button[aria-label="aiChat.uploadImage"]').exists()).toBe(false)
    expect(wrapper.find('input[type="file"]').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('accept="*/*"')
  })

  it('keeps local voice input and hides settings when the model has no runtime parameters', () => {
    const modelCapabilities = capabilities(false)
    modelCapabilities.runtime_parameters.max_history.supported = false
    const wrapper = mount(MessageInput, {
      props: { sending: false, agentId: 1, capabilities: modelCapabilities },
      global: {
        stubs: {
          DIcon: true,
          EmojiPicker: true,
          ElButton: ButtonStub,
          ElIcon: { template: '<i><slot /></i>' },
          ElPopover: { template: '<div><slot name="reference" /></div>' },
          PendingAttachments: true,
        },
      },
    })

    expect(wrapper.find('button[aria-label="aiChat.voiceInput"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="aiChat.runtimeParams"]').exists()).toBe(false)
  })
})
