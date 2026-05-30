import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const exists = (path: string) => existsSync(resolve(process.cwd(), path))
const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const contractToken = (token: string) => new RegExp(`(^|[^A-Za-z0-9_$])${token}([^A-Za-z0-9_$]|$)`, 'i')

describe('AI billing rule API contract', () => {
  it('uses admin ai-billing-rules endpoints without canvas credit or points contracts', () => {
    const source = read('src/api/ai/billingRules.ts')

    expect(source).toContain('AiBillingRuleApi')
    expect(source).toContain('${ADMIN_API_PREFIX}/ai-billing-rules/page-init')
    expect(source).toContain('${ADMIN_API_PREFIX}/ai-billing-rules')
    expect(source).not.toContain('/api/canvas')
    expect(source).not.toMatch(contractToken('credit'))
    expect(source).not.toMatch(contractToken('points'))
  })

  it('exposes the planned billing rule scenes, units, and mutations', () => {
    const source = read('src/api/ai/billingRules.ts')

    expect(source).toContain("export type AiBillingUnit = 'request' | 'image' | 'second'")
    expect(source).toContain("export type AiBillingScene = 'admin_image_generate' | 'canvas_text_generate' | 'canvas_image_generate' | 'canvas_video_generate'")
    expect(source).toContain('add: (params: AiBillingRuleMutationParams)')
    expect(source).toContain('edit: (params: AiBillingRuleMutationParams)')
    expect(source).toContain('status: (params: { id: Id; status: number })')
    expect(source).toContain('del: (params: { id: Id })')
  })

  it('validates mutation ids and keeps update body aligned with backend contract', () => {
    const source = read('src/api/ai/billingRules.ts')

    expect(source).toContain('function positiveID(value: Id | number, label: string): number')
    expect(source).not.toContain('Number(params.id)')
    expect(source).toContain('interface AiBillingRuleCreateBody')
    expect(source).toContain('interface AiBillingRuleUpdateBody')
    expect(source).toContain('function createBody(params: AiBillingRuleMutationParams): AiBillingRuleCreateBody')
    expect(source).toContain('function updateBody(params: AiBillingRuleMutationParams): AiBillingRuleUpdateBody')
    expect(source).toMatch(/add:\s*\(params: AiBillingRuleMutationParams\)[\s\S]*request\.post<\{ id: number \}, AiBillingRuleCreateBody>[\s\S]*createBody\(params\)/)
    expect(source).toMatch(/edit:\s*\(params: AiBillingRuleMutationParams\)[\s\S]*request\.put<void, AiBillingRuleUpdateBody>[\s\S]*positiveID\(params\.id[\s\S]*updateBody\(params\)/)
  })

  it('adds a billing rule dialog to AI agent config without adding a new route page', () => {
    const agentsPage = read('src/views/Main/ai/agents/index.vue')
    const dialogPath = 'src/views/Main/ai/agents/components/AgentBillingDialog/index.vue'

    expect(exists(dialogPath)).toBe(true)
    expect(agentsPage).toContain('AgentBillingDialog')
    expect(agentsPage).toContain('billingDialogVisible')
    expect(agentsPage).toContain("t('aiBilling.actions.config')")
    expect(agentsPage).toContain('<AgentBillingDialog v-model="billingDialogVisible"')
    expect(exists('src/views/Main/ai/billing-rules/index.vue')).toBe(false)
  })

  it('uses AppDialog, AppTable, and el-form with required fields in billing dialog', () => {
    const dialog = read('src/views/Main/ai/agents/components/AgentBillingDialog/index.vue')

    expect(dialog).toContain('AppDialog')
    expect(dialog).toContain('AppTable')
    expect(dialog).toContain('<el-form')
    expect(dialog).toContain('AiBillingRuleApi')
    expect(dialog).toContain('unit_price_cents')
    expect(dialog).toContain("t('aiBilling.columns.scene')")
    expect(dialog).toContain("t('aiBilling.columns.unit')")
    expect(dialog).toContain("t('aiBilling.columns.unitPrice')")
    expect(dialog).toContain("t('aiBilling.columns.status')")
    expect(dialog).toContain("t('aiBilling.columns.updatedAt')")
    expect(dialog).toContain("t('common.actions.action')")
    expect(dialog).toContain("t('aiBilling.validation.sceneRequired')")
    expect(dialog).toContain("t('aiBilling.validation.unitRequired')")
    expect(dialog).toContain("t('aiBilling.validation.unitPricePositive')")
    expect(dialog).toContain("t('aiBilling.validation.statusRequired')")
  })

  it('returns the billing dialog to add mode after save or delete', () => {
    const dialog = read('src/views/Main/ai/agents/components/AgentBillingDialog/index.vue')

    expect(dialog).toContain('function resetToAdd()')
    expect(dialog).toMatch(/function confirmSubmit\(\)[\s\S]*resetToAdd\(\)/)
    expect(dialog).toMatch(/function confirmDelete\(row: AiBillingRuleItem\)[\s\S]*resetToAdd\(\)/)
  })

  it('keeps visible billing copy in zh-CN and en-US locale catalogs', () => {
    const zh = read('src/i18n/locales/zh-CN.ts')
    const en = read('src/i18n/locales/en-US.ts')

    for (const source of [zh, en]) {
      expect(source).toContain('aiBilling:')
      expect(source).toContain('config:')
      expect(source).toContain('unitPricePositive:')
      expect(source).toContain('canvasTextGenerate:')
      expect(source).toContain('canvasImageGenerate:')
      expect(source).toContain('canvasVideoGenerate:')
    }
  })
})
