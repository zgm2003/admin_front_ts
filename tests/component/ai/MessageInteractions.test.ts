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
    sessions.appendDelta(17, 'revision-request', 'streamed prefix')
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
