import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI tools api contract', () => {
  it('uses real ai-tools REST endpoints and no old tool-map route', () => {
    const source = readFrontendSource('src/api/ai/tools.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain('request.get<AiToolInitResponse>(`${ADMIN_API_PREFIX}/ai-tools/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<AiToolItem>>(`${ADMIN_API_PREFIX}/ai-tools`')
    expect(source).toContain('request.post<AiToolCreateResponse, AiToolMutationBody>(`${ADMIN_API_PREFIX}/ai-tools`')
    expect(source).toContain('request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-tools/${positiveID(params.id,')
    expect(source).not.toContain('agent-options')
    expect(source).not.toContain('agent-bindings')
    expect(source).not.toContain('/ai-agents/')
    expect(source).not.toContain('ai-tool-maps')
    expect(source).not.toContain('legacy' + 'Request')
  })

  it('keeps tool DTOs strict and removes retired map fields', () => {
    const source = readFrontendSource('src/api/ai/tools.ts')
    const page = readFrontendSource('src/views/Main/ai/tools/index.vue')
    const list = readFrontendSource('src/views/Main/ai/tools/components/ToolList/index.vue')
    const form = readFrontendSource('src/views/Main/ai/tools/components/ToolFormDialog/index.vue')
    const combined = `${source}\n${page}\n${list}\n${form}`

    expect(source).toContain("export type AiToolRiskLevel = 'low' | 'medium' | 'high'")
    expect(source).toContain('parameters_json: JsonObject')
    expect(source).toContain('result_schema_json: JsonObject')
    expect(source).toContain('timeout_ms: number')
    expect(combined).not.toContain('executor_arr')
    expect(combined).not.toContain('executor: string')
    expect(combined).not.toContain('form.executor')
    expect(combined).not.toContain('dict.executor_arr')
    expect(combined).not.toMatch(forbiddenLooseTypePattern)
    expect(combined).not.toContain('tool_type')
    expect(combined).not.toContain('engine_tool_id')
    expect(combined).not.toContain('permission_code')
    expect(combined).not.toContain('provider_id')
    expect(combined).not.toContain('agent_id')
  })

  it('keeps the route view thin and splits real tool UI components', () => {
    const page = readFrontendSource('src/views/Main/ai/tools/index.vue')
    const list = readFrontendSource('src/views/Main/ai/tools/components/ToolList/index.vue')
    const form = readFrontendSource('src/views/Main/ai/tools/components/ToolFormDialog/index.vue')

    expect(page).toContain('<ToolList')
    expect(page).toContain('<ToolFormDialog')
    expect(page).not.toContain('AgentToolBindingDialog')
    expect(page).not.toContain('@bind')
    expect(list).toContain('defineEmits')
    expect(form).toContain('defineProps')
    expect(form).toContain('<el-select-v2')
    expect(form).toContain("width=\"isMobile ? '94vw' : '900px'\"")
    expect(form).toContain('tool-form-section')
    expect(form).toContain('basicInfo')
    expect(form).toContain('runtimeConfig')
    expect(form).toContain('schemaConfig')
    expect(form).toContain("parameters_text: ''")
    expect(form).toContain("result_schema_text: ''")
    expect(list).not.toContain("emit('bind')")
  })
})
