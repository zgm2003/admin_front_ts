import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('chat room Go REST and realtime contract', () => {
  it('routes migrated chat APIs through Go admin REST endpoints', () => {
    const source = readFrontendSource('src/api/chat/index.ts')

    expect(source).toContain('const BASE = `${ADMIN_API_PREFIX}/chat`')
    expect(source).toContain('request.get<{ list: ConversationItem[] }>(`${BASE}/conversations`')
    expect(source).toContain('request.post<{ conversation: ConversationItem }, CreatePrivateParams>(`${BASE}/conversations/private`')
    expect(source).toContain('request.get<PaginatedResponse<MessageItem>>(`${BASE}/conversations/${params.conversation_id}/messages`')
    expect(source).toContain('request.post<{ message: MessageItem }, Omit<SendMessageParams')
    expect(source).toContain('request.patch<void>(`${BASE}/conversations/${params.conversation_id}/read`)')
    expect(source).toContain('request.get<{ list: ContactItem[] }>(`${BASE}/contacts`)')
    expect(source).toContain('request.post<void, UserIDParams>(`${BASE}/contacts/${params.user_id}/requests`, params)')
    expect(source).toContain('request.patch<void>(`${BASE}/contacts/${params.user_id}/confirm`)')
    expect(source).toContain('request.delete<void>(`${BASE}/contacts/${params.user_id}`)')

    expect(source).not.toContain('legacyRequest')
    expect(source).not.toContain('/api/admin/Chat')
    expect(source).not.toContain('添加联系人迁移尚未开放')
  })

  it('uses versioned chat realtime events instead of legacy GatewayWorker event names', () => {
    const source = readFrontendSource('src/store/chat.ts')

    expect(source).toContain("'chat.message.created.v1'")
    expect(source).toContain("'chat.read.v1'")
    for (const eventName of [
      'chat_message',
      'chat_typing',
      'chat_read',
      'chat_online',
      'chat_message_recall',
      'chat_group_update',
      'chat_contact_request',
      'chat_contact_rejected',
      'chat_contact_confirmed',
      'chat_contact_deleted',
    ]) {
      expect(source).not.toContain(eventName)
    }
  })

  it('keeps touched chat API/store files strict without loose TS types', () => {
    for (const file of [
      'src/api/chat/index.ts',
      'src/store/chat.ts',
      'src/views/Main/chat/components/AddContactDialog/index.vue',
      'src/views/Main/chat/components/MessageList/index.vue',
      'tests/shared/chat/chat-api-contract.test.ts',
    ]) {
      expect(readFrontendSource(file), file).not.toMatch(forbiddenLooseTypePattern)
    }
  })

  it('keeps add-contact UI aligned with pending/confirmed contact state', () => {
    const source = readFrontendSource('src/views/Main/chat/components/AddContactDialog/index.vue')

    expect(source).toContain('type ContactAddState')
    expect(source).toContain('function getContactAddState')
    expect(source).toContain('await chatStore.loadContacts()')
    expect(source).toContain('已发送')
    expect(source).toContain('通过请求')
  })
})

