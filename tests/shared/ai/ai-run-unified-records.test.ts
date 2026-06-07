import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const runsApi = () => readFrontendSource('src/api/ai/runs.ts')
const runList = () => readFrontendSource('src/views/Main/ai/runs/components/RunList/index.vue')
const zhLocale = () => readFrontendSource('src/i18n/locales/zh-CN.ts')
const enLocale = () => readFrontendSource('src/i18n/locales/en-US.ts')

describe('unified AI run records frontend contract', () => {
  it('declares every unified run field as a real non-fallback contract field', () => {
    const source = runsApi()

    expect(source).toContain("export type AiRunPlatform = 'admin' | 'app' | 'canvas'")
    expect(source).toContain("export type AiRunModality = 'chat' | 'text' | 'image' | 'video'")
    expect(source).toContain("export type AiRunSourceType = 'ai_chat_message' | 'ai_text_task' | 'ai_image_task' | 'canvas_video_task'")
    expect(source).toContain("export type AiRunUsageStatus = 'pending' | 'reported' | 'unavailable'")

    expect(source).toContain('platform_arr: DictOption<AiRunPlatform>[]')
    expect(source).toContain('modality_arr: DictOption<AiRunModality>[]')
    expect(source).toContain('source_type_arr: DictOption<AiRunSourceType>[]')
    expect(source).toContain('usage_status_arr: DictOption<AiRunUsageStatus>[]')

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

  it('sends platform, modality, source type, and usage status filters to the backend', () => {
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

  it('renders source facts and input snapshot without requiring chat messages', () => {
    const source = runList()

    for (const key of [
      'aiRuns.filter.platform',
      'aiRuns.filter.modality',
      'aiRuns.filter.sourceType',
      'aiRuns.filter.usageStatus',
      'aiRuns.table.platform',
      'aiRuns.table.modality',
      'aiRuns.table.source',
      'aiRuns.table.usageStatus',
      'aiRuns.detail.platform',
      'aiRuns.detail.modality',
      'aiRuns.detail.sourceType',
      'aiRuns.detail.sourceId',
      'aiRuns.detail.inputSnapshot',
      'aiRuns.detail.usageStatus',
    ]) {
      expect(source).toContain(key)
    }

    expect(source).toContain('detailData.input_snapshot')
    expect(source).toContain('detailData.source_type')
    expect(source).toContain('detailData.source_id')
    expect(source).toContain('detailData.usage_status')
    expect(source).not.toContain('detailData.user_message!.content')
    expect(source).not.toContain('detailData.assistant_message!.content')
  })

  it('adds bilingual labels for unified run fields', () => {
    const zh = zhLocale()
    const en = enLocale()

    for (const key of ['platform', 'modality', 'sourceType', 'sourceId', 'inputSnapshot', 'usageStatus']) {
      expect(zh).toContain(key)
      expect(en).toContain(key)
    }
  })
})
