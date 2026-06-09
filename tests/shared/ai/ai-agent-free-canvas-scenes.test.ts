import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const exists = (path: string) => existsSync(resolve(process.cwd(), path))
const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('AI agent free Canvas scene contract', () => {
  it('keeps Canvas agent scenes without AI billing rule UI or API', () => {
    const agentsApi = read('src/api/ai/agents.ts')
    const agentsPage = read('src/views/Main/ai/agents/index.vue')
    const zh = read('src/i18n/locales/zh-CN.ts')
    const en = read('src/i18n/locales/en-US.ts')

    expect(agentsApi).toContain("export type AiAgentScene = 'chat' | 'agent_generate' | 'canvas_text_generate' | 'canvas_image_generate' | 'canvas_video_generate' | 'canvas_audio_generate'")
    expect(agentsApi).not.toContain("'image_generate'")
    expect(agentsPage).not.toContain('AgentBillingDialog')
    expect(agentsPage).not.toContain('billingDialogVisible')
    expect(exists('src/api/ai/billingRules.ts')).toBe(false)
    expect(exists('src/views/Main/ai/agents/components/AgentBillingDialog/index.vue')).toBe(false)
    expect(exists('tests/shared/ai/ai-billing-rule-api.test.ts')).toBe(false)

    for (const source of [zh, en]) {
      expect(source).not.toContain('aiBilling:')
      expect(source).toContain('canvasTextGenerate:')
      expect(source).toContain('canvasImageGenerate:')
      expect(source).toContain('canvasVideoGenerate:')
      expect(source).toContain('canvasAudioGenerate:')
    }
  })
})
