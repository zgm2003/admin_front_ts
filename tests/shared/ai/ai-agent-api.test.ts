import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI agent api contract', () => {
  it('uses ai-agents Go REST endpoints', () => {
    const source = readFrontendSource('src/api/ai/agents.ts')
    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain('request.get<AiAgentInitResponse>(`${ADMIN_API_PREFIX}/ai-agents/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<AiAgentItem>>(`${ADMIN_API_PREFIX}/ai-agents`')
    expect(source).toContain('request.get<AiAgentOptionsResponse>(`${ADMIN_API_PREFIX}/ai-agents/options`)')
    expect(source).toContain('`${ADMIN_API_PREFIX}/ai-agents/provider-models/${positiveID(params.provider_id,')
    expect(source).toContain('request.get<AiAgentToolBindingResponse>(`${ADMIN_API_PREFIX}/ai-agents/${positiveID(params.agent_id,')
    expect(source).toContain('request.put<void, AiAgentUpdateToolsBody>(`${ADMIN_API_PREFIX}/ai-agents/${positiveID(params.agent_id,')
    expect(source).toContain('request.get<AiAgentKnowledgeBindingResponse>(`${ADMIN_API_PREFIX}/ai-agents/${positiveID(params.agent_id,')
    expect(source).toContain('request.put<void, AiAgentUpdateKnowledgeBasesBody>(`${ADMIN_API_PREFIX}/ai-agents/${positiveID(params.agent_id,')
    expect(source).toContain('request.post<AiAgentCreateResponse, AiAgentMutationBody>(`${ADMIN_API_PREFIX}/ai-agents`')
    expect(source).not.toContain('/test`)')
    expect(source).not.toContain('/bindings`)')
    expect(source).not.toContain('ai-tools/agent')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('external_agent')
    expect(source).not.toContain('default_response_mode')
    expect(source).not.toContain('runtime_config')
    expect(source).not.toContain('agent_type')
    expect(source).not.toMatch(/\bcode\??:/)
    expect(source).not.toContain('Authorization')
  })

  it('keeps strict MVP mutation types', () => {
    const source = readFrontendSource('src/api/ai/agents.ts')
    expect(source).toContain("export type AiAgentScene = 'chat' | 'agent_generate' | 'image_generate'")
    expect(source).toContain('model_id: string')
    expect(source).toContain('scenes: AiAgentScene[]')
    expect(source).toContain('system_prompt?: string')
    expect(source).toContain('avatar?: string')
    expect(source).toContain('tool_ids: number[]')
    expect(source).toContain('knowledge_base_id: number')
    expect(source).toContain('base_options: AiAgentKnowledgeBaseOption[]')
    expect(source).toContain('min_score: number')
    expect(source).toContain('max_context_chars: number')
    expect(source).not.toContain('AiAgentType')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })

  it('requires an agents route view for the DB component key', () => {
    const source = readFrontendSource('src/views/Main/ai/agents/index.vue')
    const toolDialog = readFrontendSource('src/views/Main/ai/agents/components/AgentToolDialog/index.vue')
    const knowledgeDialog = readFrontendSource('src/views/Main/ai/agents/components/AgentKnowledgeDialog/index.vue')
    const combined = `${source}\n${toolDialog}\n${knowledgeDialog}`
    expect(source).toContain('AiAgentApi')
    expect(source).toContain('model_path')
    expect(source).toContain('<el-cascader')
    expect(source).toContain('scenes')
    expect(source).toContain("agentGenerate")
    expect(source).toContain("imageGenerate")
    expect(source).toContain("value: 'agent_generate'")
    expect(source).toContain("value: 'image_generate'")
    expect(source).toContain('system_prompt')
    expect(source).toContain('UpMedia')
    expect(source).toContain('<AgentToolDialog')
    expect(source).toContain('<AgentKnowledgeDialog')
    expect(source).toContain('openTools')
    expect(source).toContain('openKnowledge')
    expect(toolDialog).toContain('AiAgentApi.tools')
    expect(toolDialog).toContain('AiAgentApi.updateTools')
    expect(toolDialog).toContain('AiToolApi.list')
    expect(knowledgeDialog).toContain('AiAgentApi.knowledgeBases')
    expect(knowledgeDialog).toContain('AiAgentApi.updateKnowledgeBases')
    expect(knowledgeDialog).toContain("userStore.can('ai_agent_binding_add')")
    expect(source).toContain("key: 'scene'")
    expect(source).not.toContain("key: 'agent_type'")
    expect(source).not.toContain("key: 'code'")
    expect(source).not.toContain('Authorization')
    expect(combined).not.toMatch(forbiddenLooseTypePattern)
  })

})
