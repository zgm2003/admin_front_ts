import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const runsApi = () => readFrontendSource('src/api/ai/runs.ts')
const runPage = () => readFrontendSource('src/views/Main/ai/runs/index.vue')
const runList = () => readFrontendSource('src/views/Main/ai/runs/components/RunList/index.vue')
const runStats = () => readFrontendSource('src/views/Main/ai/runs/components/RunStats/index.vue')
const zhLocale = () => readFrontendSource('src/i18n/locales/zh-CN.ts')
const enLocale = () => readFrontendSource('src/i18n/locales/en-US.ts')

describe('unified AI run records frontend contract', () => {
  it('declares every unified run field as a real non-fallback contract field', () => {
    const source = runsApi()

    expect(source).toContain("export type AiRunPlatform = 'admin' | 'app' | 'canvas'")
    expect(source).toContain("export type AiRunModality = 'chat' | 'text' | 'image' | 'video'")
    expect(source).toContain("export type AiRunSourceType = 'ai_chat_message' | 'ai_text_task' | 'ai_image_task' | 'canvas_video_task'")
    expect(source).toContain("value === 'ai_image_task'")
    expect(source).not.toContain('admin_ai_image_task')
    expect(source).not.toContain('canvas_image_task')
    expect(source).toContain("export type AiRunUsageStatus = 'pending' | 'reported' | 'unavailable'")

    expect(source).toContain('platform_arr: DictOption<AiRunPlatform>[]')
    expect(source).toContain('platform: AiRunPlatform')
    expect(source).toContain('modality: AiRunModality')
    expect(source).toContain('source_type: AiRunSourceType')
    expect(source).toContain('source_id: number')
    expect(source).toContain('input_snapshot: string')
    expect(source).toContain('usage_status: AiRunUsageStatus')
    expect(source).toContain('conversation_id: number | null')
    expect(source).toContain('user_message: AiRunMessageSummary | null')
    expect(source).toContain('assistant_message: AiRunMessageSummary | null')

    expect(source).not.toMatch(/source_id\?:/)
    expect(source).not.toMatch(/source_id:\s*number\s*\|\s*null/)
    expect(source).not.toMatch(/input_snapshot\?:/)
    expect(source).not.toMatch(/input_snapshot:\s*string\s*\|\s*null/)
    expect(source).not.toContain('usage_json')
    expect(source).not.toContain('cost')
  })

  it('keeps source-fact query fields typed for API compatibility', () => {
    const source = runsApi()

    expect(source).toContain('platform?: AiRunPlatform |')
    expect(source).toContain('modality?: AiRunModality |')
    expect(source).toContain('source_type?: AiRunSourceType |')
    expect(source).toContain('usage_status?: AiRunUsageStatus |')
    expect(source).toContain('if (params.platform) query.platform = params.platform')
    expect(source).toContain('if (params.modality) query.modality = params.modality')
    expect(source).toContain('if (params.source_type) query.source_type = params.source_type')
    expect(source).toContain('if (params.usage_status) query.usage_status = params.usage_status')
  })

  it('keeps low-value source facts out of the visible run monitor UI', () => {
    const source = runList()

    for (const key of [
      'aiRuns.filter.platform',
      'aiRuns.table.platform',
      'aiRuns.detail.platform',
      'aiRuns.detail.inputSnapshot',
    ]) {
      expect(source).toContain(key)
    }

    expect(source).toContain('detailData.input_snapshot')
    expect(source).not.toContain('aiRuns.filter.modality')
    expect(source).not.toContain('aiRuns.filter.sourceType')
    expect(source).not.toContain('aiRuns.filter.usageStatus')
    expect(source).not.toContain('aiRuns.table.modality')
    expect(source).not.toContain('aiRuns.table.source')
    expect(source).not.toContain('aiRuns.table.usageStatus')
    expect(source).not.toContain('aiRuns.detail.modality')
    expect(source).not.toContain('aiRuns.detail.sourceType')
    expect(source).not.toContain('aiRuns.detail.sourceId')
    expect(source).not.toContain('aiRuns.detail.usageStatus')
    expect(source).not.toContain('detailData.source_type')
    expect(source).not.toContain('detailData.source_id')
    expect(source).not.toContain('detailData.usage_status')
    expect(source).not.toContain('detailData.user_message!.content')
    expect(source).not.toContain('detailData.assistant_message!.content')
  })

  it('adds bilingual labels for unified run fields', () => {
    const zh = zhLocale()
    const en = enLocale()

    for (const key of ['platform', 'inputSnapshot']) {
      expect(zh).toContain(key)
      expect(en).toContain(key)
    }
  })

  it('keeps run monitor tab and empty stats tables on stable component lifecycles', () => {
    const page = runPage()
    const stats = runStats()

    expect(page).toContain('<RunStats/>')
    expect(page).not.toContain('v-if="activeTab ===')

    expect(stats).not.toContain('v-if="dateLoader.state.value.data.length || dateLoader.state.value.loading"')
    expect(stats).not.toContain('v-if="agentLoader.state.value.data.length || agentLoader.state.value.loading"')
    expect(stats).toContain(':data="dateLoader.state.value.data"')
    expect(stats).toContain(':data="agentLoader.state.value.data"')
  })
})
