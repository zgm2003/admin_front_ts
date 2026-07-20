// @vitest-environment jsdom

import axe from 'axe-core'
import { ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AiRoleEnum } from '@/enums'
import MessageList from '@/views/Main/ai/chat/components/MessageList/index.vue'
import MessageInput from '@/views/Main/ai/chat/components/MessageInput/index.vue'

const mocks = vi.hoisted(() => ({ announcePolite: vi.fn() }))

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/hooks/useResponsive', () => ({ useIsMobile: () => ({ value: false }) }))
vi.mock('@/shared/accessibility/announcer', () => ({ announcePolite: mocks.announcePolite }))
vi.mock('@/views/Main/ai/chat/components/MessageInput/use-image-attachments', () => ({
  useImageAttachments: () => ({
    setFileInputRef: vi.fn(),
    pendingAttachments: ref([]),
    isDragging: ref(false),
    supportsImage: ref(false),
    isImageLimitReached: ref(false),
    handleUploadClick: vi.fn(),
    handleFileChange: vi.fn(),
    removeAttachment: vi.fn(),
    handlePaste: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDrop: vi.fn(),
  }),
}))
vi.mock('@/views/Main/ai/chat/components/MessageInput/use-speech-input', () => ({
  useSpeechInput: () => ({ isRecording: ref(false), toggleVoiceInput: vi.fn() }),
}))

const ElButtonStub = {
  name: 'ElButton',
  inheritAttrs: false,
  template: '<button v-bind="$attrs"><slot /></button>',
}
const MarkdownRendererStub = {
  name: 'MarkdownRenderer',
  props: { content: { type: String, required: true } },
  template: '<p>{{ content }}</p>',
}
const ElPopoverStub = {
  name: 'ElPopover',
  template: '<div><slot name="reference" /><slot /></div>',
}

const streamingMessage = {
  id: 31,
  request_id: 'request-31',
  role: AiRoleEnum.ASSISTANT,
  content: '',
  isStreaming: true,
  meta_json: null,
}

describe('AI chat accessibility', () => {
  beforeEach(() => vi.clearAllMocks())

  it('announces one terminal assistant response without announcing stream deltas', async () => {
    const wrapper = mount(MessageList, {
      attachTo: document.body,
      props: { messages: [streamingMessage], loading: false, sending: true },
      global: {
        stubs: {
          MarkdownRenderer: MarkdownRendererStub,
          ElIcon: true,
          ElButton: ElButtonStub,
          ElImage: true,
          ElImageViewer: true,
        },
      },
    })

    expect(wrapper.get('[role="log"]').attributes('aria-label')).toBeTruthy()
    expect(mocks.announcePolite).not.toHaveBeenCalled()
    await wrapper.setProps({
      messages: [{ ...streamingMessage, content: 'Finished', isStreaming: false }],
      sending: false,
    })
    await flushPromises()
    expect(mocks.announcePolite).toHaveBeenCalledTimes(1)

    await wrapper.setProps({
      messages: [{ ...streamingMessage, content: 'Finished', isStreaming: false }],
    })
    expect(mocks.announcePolite).toHaveBeenCalledTimes(1)
  })

  it('labels the composer toolbar, textarea, and stop action', async () => {
    const wrapper = mount(MessageInput, {
      attachTo: document.body,
      props: { sending: false, disabled: false, isStreaming: true, showHistoryBtn: true },
      global: {
        stubs: {
          ElButton: ElButtonStub,
          ElIcon: true,
          ElPopover: ElPopoverStub,
          DIcon: true,
          EmojiPicker: true,
          RuntimeParamsPanel: true,
          PendingAttachments: true,
        },
      },
    })

    expect(wrapper.get('[role="toolbar"]').attributes('aria-label')).toBeTruthy()
    expect(wrapper.get('label[for="ai-chat-input"]').exists()).toBe(true)
    expect(wrapper.get('#ai-chat-input').attributes('aria-describedby')).toBeTruthy()
    expect(wrapper.get('button.stop-button').attributes('aria-label')).toBeTruthy()

    const result = await axe.run(wrapper.element, {
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(result.violations.filter((violation) => violation.impact === 'serious'
      || violation.impact === 'critical')).toEqual([])
  })
})
