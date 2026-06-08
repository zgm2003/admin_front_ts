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
  it('declares AI run provider-attempt fields without polymorphic source fields', () => {
    const source = runsApi()

    expect(source).toContain("export type AiRunPlatform = 'admin' | 'app' | 'canvas'")
    expect(source).not.toContain('AiRunModality')
    expect(source).not.toContain('AiRunSourceType')
    expect(source).not.toContain('AiRunUsageStatus')
    expect(source).not.toContain('modality')
    expect(source).not.toContain('source_type')
    expect(source).not.toContain('source_id')
    expect(source).not.toContain('usage_status')
    expect(source).not.toContain("value === 'ai_image_task'")
    expect(source).not.toContain('ai_chat_message')
    expect(source).not.toContain('ai_text_task')
    expect(source).not.toContain('ai_image_task')
    expect(source).not.toContain('canvas_video_task')
    expect(source).not.toContain('admin_ai_image_task')
    expect(source).not.toContain('canvas_image_task')

    expect(source).toContain('platform_arr: DictOption<AiRunPlatform>[]')
    expect(source).toContain('platform: AiRunPlatform')
    expect(source).toContain('input_snapshot: string')
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

  it('keeps only real run monitor query fields typed', () => {
    const source = runsApi()

    expect(source).toContain('platform?: AiRunPlatform |')
    expect(source).toContain('if (params.platform) query.platform = params.platform')
    expect(source).not.toContain('modality?:')
    expect(source).not.toContain('source_type?:')
    expect(source).not.toContain('usage_status?:')
    expect(source).not.toContain('query.modality')
    expect(source).not.toContain('query.source_type')
    expect(source).not.toContain('query.usage_status')
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
