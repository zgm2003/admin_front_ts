// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ConversationList from '@/views/Main/ai/chat/components/ConversationList/index.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/i18n', () => ({ default: { global: { t: (key: string) => key } } }))

describe('conversation unread state', () => {
  it('renders the authoritative unread count in a stable trailing slot', () => {
    const wrapper = mount(ConversationList, {
      props: {
        conversations: [
          {
            id: 17,
            agent_id: 2,
            agent_name: 'Agent',
            title: 'Unread chat',
            last_message_at: '2026-07-27T10:00:00Z',
            updated_at: '2026-07-27T10:00:00Z',
            unread_count: 12,
          },
          {
            id: 18,
            agent_id: 2,
            agent_name: 'Agent',
            title: 'Read chat',
            last_message_at: '2026-07-27T09:00:00Z',
            updated_at: '2026-07-27T09:00:00Z',
            unread_count: 0,
          },
        ],
        loading: false,
        loadingMore: false,
        hasMore: false,
        currentId: 18,
      },
      global: {
        stubs: {
          ElButton: { template: '<button><slot /></button>' },
          ElInput: true,
          ElIcon: { template: '<i><slot /></i>' },
          ElScrollbar: { template: '<div><slot /></div>' },
          ElDropdown: { template: '<div><slot /><slot name="dropdown" /></div>' },
          ElDropdownMenu: { template: '<div><slot /></div>' },
          ElDropdownItem: { template: '<button><slot /></button>' },
        },
      },
    })

    const slots = wrapper.findAll('.conversation-unread-slot')
    expect(slots).toHaveLength(2)
    expect(slots[0]!.text()).toBe('12')
    expect(slots[1]!.text()).toBe('')
    expect(slots[0]!.attributes('aria-label')).toBe('accessibility.unread')
  })
})
