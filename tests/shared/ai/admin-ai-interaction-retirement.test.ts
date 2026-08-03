import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()

const retiredPaths = [
  'src/views/Main/ai/prompts',
  'src/views/Main/ai/image-playground',
  'src/views/Main/ai/assets',
  'src/api/ai/prompts.ts',
  'src/api/ai/images.ts',
  'src/api/ai/assets.ts',
  'src/api/ai/model-prices.ts',
  'src/views/Main/ai/model-pricing',
  'src/views/Main/ai/knowledge',
  'src/views/Main/ai/agents/components/AgentKnowledgeDialog',
  'src/api/ai/knowledge.ts',
  'src/api/ai/knowledge.types.ts',
]

describe('admin AI interactive surfaces are retired', () => {
  test('does not ship Prompt, image workspace, or asset management files', () => {
    for (const path of retiredPaths) {
      expect(existsSync(join(root, path))).toBe(false)
    }
  })

  test('does not keep admin image or asset menu/i18n keys', () => {
    const combined = ['zh-CN', 'en-US'].flatMap((locale) => {
      const directory = join(root, 'src/i18n/locales', locale)
      return readdirSync(directory)
        .filter((name) => name.endsWith('.ts'))
        .sort()
        .map((name) => readFileSync(join(directory, name), 'utf8'))
    }).join('\n')

    for (const token of [
      'ai_image_playground',
      'ai_assets',
      '图片工作台',
      'Image Playground',
      'assetLibrary'
    ]) {
      expect(combined).not.toContain(token)
    }
  })

  test('ships only the official model route and permission vocabulary', () => {
    expect(existsSync(join(root, 'src/api/ai/official-models.ts'))).toBe(true)
    expect(existsSync(join(root, 'src/views/Main/ai/official-models/index.vue'))).toBe(true)

    const sourceRoots = ['src/api/ai', 'src/views/Main/ai', 'src/i18n/locales']
    const files: string[] = []
    function collect(directory: string) {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name)
        if (entry.isDirectory()) collect(path)
        else if (/\.(ts|vue|css)$/.test(entry.name)) files.push(path)
      }
    }
    sourceRoots.forEach((directory) => collect(join(root, directory)))
    const source = files.sort().map((file) => readFileSync(file, 'utf8')).join('\n')
    for (const retired of ['model-pricing', 'ai-model-prices', 'ai_model_pricing', 'aiModelPricing']) {
      expect(source).not.toContain(retired)
    }
    expect(source).toContain('ai_official_model_price_sync')
    expect(source).toContain('aiOfficialModel')
  })

  test('physically retires the old knowledge and history override vocabulary', () => {
    const roots = ['src', 'contracts/backend/admin', 'scripts/test-migration-manifest.json']
    const files: string[] = []
    function collect(path: string) {
      if (!existsSync(join(root, path))) return
      const entries = readdirSync(join(root, path), { withFileTypes: true })
      for (const entry of entries) {
        const relative = join(path, entry.name)
        if (entry.isDirectory()) collect(relative)
        else files.push(join(root, relative))
      }
    }
    collect(roots[0]!)
    collect(roots[1]!)
    files.push(join(root, roots[2]!))
    const source = files.map(file => readFileSync(file, 'utf8')).join('\n')
    for (const token of [
      'aiKnowledge', 'ai_knowledge', 'ai/knowledge', 'AgentKnowledge',
      'maxHistory', 'max_history', 'knowledge_retrieval', 'knowledge_base',
    ]) expect(source).not.toContain(token)
  })
})
