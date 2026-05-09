import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI conversation api REST contract', () => {
  it('uses Go REST endpoints instead of legacy AiConversations routes', () => {
    const source = readFrontendSource('src/api/ai/conversations.ts')
    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<PaginatedResponse<AiConversationItem>>(`${ADMIN_API_PREFIX}/ai-conversations`')
    expect(source).toContain('request.get<AiConversationDetailResponse>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(params.id)}`)')
    expect(source).toContain('request.post<{ id: number }, AiConversationCreateBody>(`${ADMIN_API_PREFIX}/ai-conversations`')
    expect(source).toContain('request.put<void, AiConversationTitleBody>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(params.id)}`')
    expect(source).toContain('request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(item)}/status`')
    expect(source).toContain('request.delete<void>(`${ADMIN_API_PREFIX}/ai-conversations/${id}`)')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('/api/admin/AiConversations')
  })

  it('keeps AI conversation api types strict', () => {
    const source = readFrontendSource('src/api/ai/conversations.ts')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })

  it('uses agent_id as the only selector', () => {
    const source = readFrontendSource('src/api/ai/conversations.ts')
    expect(source).toContain("agent_id?: number | ''")
    expect(source).toContain("if (typeof params.agent_id === 'number') query.agent_id = params.agent_id")
    expect(source).toContain('add: (params: { agent_id: number; title?: string }) =>')
    expect(source).not.toContain('app' + '_id')
  })

  it('chat page loads AI agent options and sends agent_id from the new selector', () => {
    const useAgents = readFrontendSource('src/views/Main/ai/chat/composables/useAgents.ts')
    const useConversations = readFrontendSource('src/views/Main/ai/chat/composables/useConversations.ts')
    const useStreamChat = readFrontendSource('src/views/Main/ai/chat/composables/useStreamChat.ts')
    const chatView = readFrontendSource('src/views/Main/ai/chat/index.vue')

    expect(useAgents).toContain("import { AiAgentApi }")
    expect(useAgents).toContain('AiAgentApi.options()')
    expect(useConversations).toContain('agent_id: currentAgentId.value ?? undefined')
    expect(chatView).toContain('loadConversations({ agent_id: agent.id })')
    expect(chatView).not.toContain('loadConversations({ app' + '_id:')
    expect(useStreamChat).toContain('agent_id: requestConversationId ? undefined : agentId')
    expect(useStreamChat).not.toContain('app' + '_id')
  })


  it('runs page uses agent and provider filters plus persisted event details', () => {
    const runsApi = readFrontendSource('src/api/ai/runs.ts')
    const runList = readFrontendSource('src/views/Main/ai/runs/components/RunList/index.vue')
    const runStats = readFrontendSource('src/views/Main/ai/runs/components/RunStats/index.vue')

    expect(runsApi).toContain('agentArr: DictOption<number>[]')
    expect(runsApi).toContain('providerArr: DictOption<number>[]')
    expect(runList).toContain("agent_id: '' as number | ''")
    expect(runList).toContain("provider_id: '' as number | ''")
    expect(runList).toContain("{key: 'agent_name'")
    expect(runList).toContain("{key: 'provider_name'")
    expect(runList).toContain('detailData.events')
    expect(runStats).toContain('agent_id: searchForm.value.agent_id')
    expect(runStats).toContain("statsColumns('agent_name', t('aiRuns.stats.agent'))")
  })

})
