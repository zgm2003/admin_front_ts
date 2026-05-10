import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\b${'an'}${'y'}\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI conversation api REST contract', () => {
  it('uses only current conversation endpoints', () => {
    const source = readFrontendSource('src/api/ai/conversations.ts')
    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<AiConversationListResponse>(`${ADMIN_API_PREFIX}/ai-conversations`')
    expect(source).toContain('request.get<AiConversationDetailResponse>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(params.id)}`)')
    expect(source).toContain('request.post<{ id: number }, AiConversationCreateBody>(`${ADMIN_API_PREFIX}/ai-conversations`')
    expect(source).toContain('request.put<void, AiConversationEditBody>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(params.id)}`')
    expect(source).toContain('request.delete<void>(`${ADMIN_API_PREFIX}/ai-conversations/${id}`)')
    expect(source).not.toContain('PaginatedResponse')
    expect(source).not.toContain('status')
    expect(source).not.toContain('request.patch')
    expect(source).not.toContain('/api/admin/AiConversations')
  })

  it('keeps only minimal response fields', () => {
    const source = readFrontendSource('src/api/ai/conversations.ts')
    expect(source).toContain('last_message_at: string')
    expect(source).toContain('updated_at: string')
    expect(source).not.toContain('user_id')
    expect(source).not.toContain('status_name')
    expect(source).not.toContain('is_del')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })

  it('chat page uses agent_id and not old app or stream managers', () => {
    const useAgents = readFrontendSource('src/views/Main/ai/chat/composables/useAgents.ts')
    const useConversations = readFrontendSource('src/views/Main/ai/chat/composables/useConversations.ts')
    const chatView = readFrontendSource('src/views/Main/ai/chat/index.vue')

    expect(useAgents).toContain('AiAgentApi.options()')
    expect(useConversations).toContain('agent_id: agentId')
    expect(chatView).toContain('createAiRequestId')
    expect(chatView).toContain('useConversationSessions')
    expect(chatView).toContain('useConversationSocket')
    expect(chatView).not.toContain('useStream' + 'Chat')
    expect(chatView).not.toContain('useChatSession' + 'Manager')
    expect(chatView).not.toContain('app' + '_id')
  })
})
