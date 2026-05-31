import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

function snake(parts: string[]) {
  return parts.join('_')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI run api REST contract', () => {
  it('uses Go REST endpoints instead of legacy AiRuns routes', () => {
    const source = readFrontendSource('src/api/ai/runs.ts')
    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<AiRunInitResponse>(`${ADMIN_API_PREFIX}/ai-runs/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<AiRunItem>>(`${ADMIN_API_PREFIX}/ai-runs`')
    expect(source).toContain('request.get<AiRunDetailResponse>(`${ADMIN_API_PREFIX}/ai-runs/${positiveID(params.id)}`)')
    expect(source).toContain('request.get<AiRunStatsSummaryResponse>(`${ADMIN_API_PREFIX}/ai-runs/stats`')
    expect(source).toContain('request.get<PaginatedResponse<AiRunStatsByDateItem>>(`${ADMIN_API_PREFIX}/ai-runs/stats/by-date`')
    expect(source).toContain('request.get<PaginatedResponse<AiRunStatsByAgentItem>>(`${ADMIN_API_PREFIX}/ai-runs/stats/by-agent`')
    expect(source).toContain('request.get<PaginatedResponse<AiRunStatsByUserItem>>(`${ADMIN_API_PREFIX}/ai-runs/stats/by-user`')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('/api/admin/AiRuns')
  })

  it('keeps AI run api types strict', () => {
    const source = readFrontendSource('src/api/ai/runs.ts')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })

  it('uses the token-only run monitor field contract', () => {
    const apiSource = readFrontendSource('src/api/ai/runs.ts')
    const listSource = readFrontendSource('src/views/Main/ai/runs/components/RunList/index.vue')
    const statsSource = readFrontendSource('src/views/Main/ai/runs/components/RunStats/index.vue')
    const combined = `${apiSource}\n${listSource}\n${statsSource}`

    expect(apiSource).toContain('status_arr: DictOption<AiRunStatus>[]')
    expect(apiSource).toContain("export type AiRunStatus = 'running' | 'success' | 'failed' | 'canceled' | 'timeout'")
    expect(apiSource).toContain('status?: AiRunStatus |')
    expect(apiSource).toContain('model_id: string')
    expect(apiSource).toContain('model_display_name: string')
    expect(apiSource).toContain('duration_ms?: number | null')
    expect(apiSource).toContain('duration_text: string')
    expect(apiSource).toContain('error_message: string')
    expect(apiSource).toContain('avg_duration_ms: number')
    expect(apiSource).toContain('message: string')
    expect(apiSource).toContain('event_type_name: string')
    expect(apiSource).toContain('elapsed_ms?: number | null')
    expect(apiSource).toContain('elapsed_text: string')
    expect(apiSource).toContain("export type AiRunToolCallStatus = 'running' | 'success' | 'failed' | 'timeout'")
    expect(apiSource).toContain('knowledge_retrievals: AiRunKnowledgeRetrievalItem[]')
    expect(apiSource).toContain('hits: AiRunKnowledgeHitItem[]')
    expect(apiSource).toContain('score: number')
    expect(apiSource).toContain('content_snapshot: string')
    expect(apiSource).toContain('skip_reason: string')
    expect(apiSource).toContain('tool_calls: AiRunToolCallItem[]')
    expect(apiSource).toContain('arguments_json: JsonObject')
    expect(apiSource).toContain('result_json?: JsonObject | null')

    expect(combined).not.toMatch(new RegExp(snake(['run', 'status'])))
    expect(combined).not.toMatch(new RegExp(snake(['model', 'snapshot'])))
    expect(combined).not.toMatch(new RegExp(snake(['engine', 'task', 'id'])))
    expect(combined).not.toMatch(new RegExp(snake(['engine', 'run', 'id'])))
    expect(combined).not.toMatch(new RegExp(snake(['latency', 'ms'])))
    expect(combined).not.toMatch(new RegExp(snake(['latency', 'str'])))
    expect(combined).not.toMatch(new RegExp(snake(['error', 'msg'])))
    expect(combined).not.toMatch(new RegExp(snake(['usage', 'json'])))
    expect(combined).not.toMatch(new RegExp(snake(['output', 'snapshot', 'json'])))
    expect(combined).not.toMatch(new RegExp(snake(['payload', 'json'])))
    expect(combined).not.toMatch(new RegExp(snake(['delta', 'text'])))
    expect(combined).not.toMatch(new RegExp(['AiRun', 'Step'].join('')))
    expect(combined).not.toMatch(new RegExp(['step', 's'].join('')))
  })

  it('renders only meaningful assistant metadata and richer run event facts', () => {
    const listSource = readFrontendSource('src/views/Main/ai/runs/components/RunList/index.vue')

    expect(listSource).toContain('hasAssistantMeta')
    expect(listSource).toContain('v-if="detailData.assistant_message.meta_json && hasAssistantMeta(detailData.assistant_message.meta_json)"')
    expect(listSource).toContain('event.event_type_name || event.event_type')
    expect(listSource).toContain('event.elapsed_text')
    expect(listSource).toContain('terminal-run-facts')
    expect(listSource).toContain('detailData.knowledge_retrievals')
    expect(listSource).toContain('knowledge-retrieval-card')
    expect(listSource).toContain('content_snapshot')
    expect(listSource).toContain('detailData.tool_calls')
    expect(listSource).toContain('tool-call-card')
    expect(listSource).toContain('prettyJSON')
  })

  it('keeps the statistics tab key-only and avoids loading a user ranking', () => {
    const statsSource = readFrontendSource('src/views/Main/ai/runs/components/RunStats/index.vue')

    expect(statsSource).toContain('const TOP_LIMIT = 10')
    expect(statsSource).toContain('keyOnlyTip')
    expect(statsSource).toContain('topAgents')
    expect(statsSource).toContain('recentDates')
    expect(statsSource).not.toContain('AiRunStatsByUserItem')
    expect(statsSource).not.toContain('statsByUser')
    expect(statsSource).not.toContain('loadMore')
  })

  it('exposes pageInit for run page dictionaries with init alias', () => {
    const source = readFrontendSource('src/api/ai/runs.ts')
    expect(source).toContain('const pageInit = () => request.get<AiRunInitResponse>')
    expect(source).toContain('pageInit,')
    expect(source).toContain('init: pageInit')
  })

})
