// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createApiError } from '@/modules/http/error'
import MessageList from '@/views/Main/ai/chat/components/MessageList/index.vue'
import { createActionRequestIdentityRegistry } from '@/views/Main/ai/chat/composables/useActionRequestIdentity'
import { useConversationSessions } from '@/views/Main/ai/chat/composables/useConversationSessions'
import { useMessageSelection } from '@/views/Main/ai/chat/composables/useMessageSelection'
import type { Message } from '@/views/Main/ai/chat/composables/types'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/shared/accessibility/announcer', () => ({ announcePolite: vi.fn() }))

const messages: Message[] = [
  {
    id: 101,
    role: 1,
    content_type: 'text',
    content: 'Original question',
    created_at: '2026-07-27T10:00:00Z',
    updated_at: '2026-07-27T10:00:00Z',
    paired_message_id: 202,
    run_id: null,
    liked: false,
    delivery_state: null,
    settlement_pending: false,
    meta_json: {
      attachments: [{ name: 'reference.png', size: 1024, type: 'image', url: 'https://example.test/reference.png' }],
      runtime_params: { temperature: 0.4 },
    },
  },
  {
    id: 202,
    role: 2,
    content_type: 'text',
    content: 'Assistant answer',
    created_at: '2026-07-27T10:00:01Z',
    updated_at: '2026-07-27T10:00:01Z',
    paired_message_id: 101,
    run_id: 707,
    liked: false,
    delivery_state: 'completed',
    settlement_pending: false,
  },
]

const ButtonStub = {
  inheritAttrs: false,
  props: ['disabled'],
  emits: ['click'],
  template: '<button :disabled="disabled" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
}

function mountList(props: Record<string, unknown> = {}) {
  return mount(MessageList, {
    props: { messages, loading: false, ...props },
    global: {
      stubs: {
        MarkdownRenderer: { props: ['content'], template: '<div>{{ content }}</div>' },
        ElButton: ButtonStub,
        ElTooltip: { template: '<span><slot /></span>' },
        ElText: { template: '<div><slot /></div>' },
        ElIcon: { template: '<i><slot /></i>' },
        ElCheckbox: {
          inheritAttrs: false,
          props: ['modelValue', 'disabled'],
          emits: ['change'],
          template: '<input type="checkbox" :checked="modelValue" :disabled="disabled" v-bind="$attrs" @change="$emit(\'change\', $event.target.checked)">',
        },
        ElImage: { template: '<div><slot /></div>' },
        ElImageViewer: true,
      },
    },
  })
}

function action(wrapper: ReturnType<typeof mountList>, label: string) {
  return wrapper.get(`button[aria-label="${label}"]`)
}

describe('message interactions', () => {
  it('creates a new action identity but reuses it after an unknown transport outcome', () => {
    const createRequestId = vi.fn()
      .mockReturnValueOnce('request-1')
      .mockReturnValueOnce('request-2')
      .mockReturnValueOnce('request-3')
    const identities = createActionRequestIdentityRegistry(createRequestId)

    expect(identities.acquire('edit:17:101:first')).toBe('request-1')
    identities.settle('edit:17:101:first', createApiError({
      kind: 'network',
      retryable: true,
      messageKey: 'http.network',
    }))
    expect(identities.acquire('edit:17:101:first')).toBe('request-1')

    identities.settle('edit:17:101:first')
    expect(identities.acquire('edit:17:101:first')).toBe('request-2')
    expect(identities.acquire('regenerate:17:202')).toBe('request-3')
  })

  it('keeps the accepted reply owner while merging authoritative replacement history', () => {
    const sessions = useConversationSessions()
    sessions.replaceMessages(17, messages, 0, false)

    sessions.beginAcceptedReply(17, 'revision-request', 303)
    sessions.appendDelta(17, 'revision-request', 1, 'streamed prefix')
    sessions.recoverAcceptedMessages(17, [{
      ...messages[0]!,
      id: 303,
      content: 'Changed question',
      paired_message_id: null,
    }], 0, false, 'revision-request')

    expect(sessions.get(17)).toMatchObject({
      pendingRequestId: 'revision-request',
      isStreaming: true,
    })
    expect(sessions.get(17)?.messages.map(({ id }) => id)).toEqual([303, expect.any(Number)])
    expect(sessions.get(17)?.messages.at(-1)?.content).toBe('streamed prefix')

    sessions.complete(17, 'revision-request', 404)
    sessions.recoverAcceptedMessages(17, [messages[0]!], 0, false, 'revision-request')
    expect(sessions.get(17)?.messages.at(-1)?.id).toBe(404)
  })

  it('defaults selection to the trigger and explicit pair while allowing either to be deselected', () => {
    const selection = useMessageSelection()

    selection.open(messages[1]!)
    expect(selection.selectedIds.value).toEqual([101, 202])

    selection.setSelected(101, false)
    expect(selection.selectedIds.value).toEqual([202])

    selection.setSelected(202, false)
    expect(selection.selectedIds.value).toEqual([])
  })

  it('renders only the role-specific compact actions', () => {
    const wrapper = mountList({ speechSupported: true })
    const rows = wrapper.findAll('article')

    expect(rows[0]!.find('button[aria-label="aiChat.copyMessage"]').exists()).toBe(true)
    expect(rows[0]!.find('button[aria-label="aiChat.editMessage"]').exists()).toBe(true)
    expect(rows[0]!.find('button[aria-label="aiChat.deleteMessage"]').exists()).toBe(true)
    expect(rows[0]!.find('button[aria-label="aiChat.speakMessage"]').exists()).toBe(false)

    expect(rows[1]!.find('button[aria-label="aiChat.copyMessage"]').exists()).toBe(true)
    expect(rows[1]!.find('button[aria-label="aiChat.speakMessage"]').exists()).toBe(true)
    expect(rows[1]!.find('button[aria-label="aiChat.like"]').exists()).toBe(true)
    expect(rows[1]!.find('button[aria-label="aiChat.regenerate"]').exists()).toBe(true)
    expect(rows[1]!.find('button[aria-label="aiChat.deleteMessage"]').exists()).toBe(true)
    expect(rows[1]!.find('button[aria-label="aiChat.editMessage"]').exists()).toBe(false)
  })

  it('edits only user text and keeps inherited attachments read-only', async () => {
    const wrapper = mountList()

    await action(wrapper, 'aiChat.editMessage').trigger('click')
    const editor = wrapper.get('textarea')
    expect((editor.element as HTMLTextAreaElement).value).toBe('Original question')
    expect(wrapper.text()).toContain('reference.png')
    expect(wrapper.find('input[type="file"]').exists()).toBe(false)

    await editor.setValue('Changed question')
    await action(wrapper, 'aiChat.editSubmit').trigger('click')

    expect(wrapper.emitted('edit')?.[0]).toEqual([messages[0], 'Changed question'])
  })

  it('keeps copy available while disabling edit, regenerate and delete during active work', () => {
    const wrapper = mountList({ interactionDisabled: true, speechSupported: true })

    expect(action(wrapper, 'aiChat.copyMessage').attributes('disabled')).toBeUndefined()
    expect(action(wrapper, 'aiChat.editMessage').attributes('disabled')).toBeDefined()
    expect(action(wrapper, 'aiChat.regenerate').attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('button[aria-label="aiChat.deleteMessage"]')
      .every((button) => button.attributes('disabled') !== undefined)).toBe(true)
  })

  it('renders a stopped reply and locks historical mutations only while settlement is pending', async () => {
    const stoppedMessages: Message[] = [
      { ...messages[0]!, paired_message_id: 202 },
      {
        ...messages[1]!,
        content: '1234',
        delivery_state: 'stopped',
        settlement_pending: true,
      },
    ]
    const wrapper = mountList({
      messages: stoppedMessages,
      selectionMode: true,
      speechSupported: true,
    })
    const rows = wrapper.findAll('article')

    expect(wrapper.text()).toContain('aiChat.generationStopped')
    expect(wrapper.find('.typing-dots').exists()).toBe(false)
    expect(rows[1]!.get('button[aria-label="aiChat.copyMessage"]').attributes('disabled')).toBeUndefined()
    expect(rows[1]!.get('button[aria-label="aiChat.speakMessage"]').attributes('disabled')).toBeUndefined()
    expect(rows[1]!.get('button[aria-label="aiChat.like"]').attributes('disabled')).toBeDefined()
    expect(rows[1]!.get('button[aria-label="aiChat.regenerate"]').attributes('disabled')).toBeDefined()
    expect(rows[1]!.get('button[aria-label="aiChat.deleteMessage"]').attributes('disabled')).toBeDefined()
    expect(rows[0]!.get('button[aria-label="aiChat.editMessage"]').attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('input[type="checkbox"]')
      .every((checkbox) => checkbox.attributes('disabled') !== undefined)).toBe(true)

    await wrapper.setProps({
      messages: stoppedMessages.map((message) => ({ ...message, settlement_pending: false })),
    })
    const settledRows = wrapper.findAll('article')
    expect(settledRows[1]!.get('button[aria-label="aiChat.like"]').attributes('disabled')).toBeDefined()
    expect(settledRows[1]!.get('button[aria-label="aiChat.regenerate"]').attributes('disabled')).toBeUndefined()
    expect(settledRows[1]!.get('button[aria-label="aiChat.deleteMessage"]').attributes('disabled')).toBeUndefined()
    expect(settledRows[0]!.get('button[aria-label="aiChat.editMessage"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.findAll('input[type="checkbox"]')
      .every((checkbox) => checkbox.attributes('disabled') === undefined)).toBe(true)
  })

  it('shows an empty stopped reply without typing, copy, or speech affordances', () => {
    const wrapper = mountList({
      messages: [{
        ...messages[1]!,
        content: '',
        delivery_state: 'stopped',
        settlement_pending: false,
      }],
      speechSupported: true,
    })

    expect(wrapper.text()).toContain('aiChat.generationStopped')
    expect(wrapper.find('.typing-dots').exists()).toBe(false)
    expect(action(wrapper, 'aiChat.copyMessage').attributes('disabled')).toBeDefined()
    expect(action(wrapper, 'aiChat.speakMessage').attributes('disabled')).toBeDefined()
    expect(action(wrapper, 'aiChat.like').attributes('disabled')).toBeDefined()
  })

  it('emits exact message identities for feedback, regeneration and selection', async () => {
    const wrapper = mountList({ selectionMode: true, selectedMessageIds: [202], speechSupported: true })

    await action(wrapper, 'aiChat.like').trigger('click')
    await action(wrapper, 'aiChat.regenerate').trigger('click')
    const assistantCheckbox = wrapper.findAll('input[type="checkbox"]')[1]!
    await assistantCheckbox.setValue(false)

    expect(wrapper.emitted('feedback')?.[0]).toEqual([messages[1], true])
    expect(wrapper.emitted('regenerate')?.[0]).toEqual([messages[1]])
    expect(wrapper.emitted('toggleSelection')?.[0]).toEqual([202, false])
  })
})
