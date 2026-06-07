import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  const path = resolve(process.cwd(), relativePath)
  expect(existsSync(path), `${relativePath} should exist`).toBe(true)
  return readFileSync(path, 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

function expectStandardCrudApi(source: string, resource: 'ai-prompts' | 'ai-assets') {
  expect(source).toContain(`\${ADMIN_API_PREFIX}/${resource}`)
  for (const method of ['pageInit', 'list', 'detail', 'create', 'update', 'deleteOne', 'deleteBatch']) {
    expect(source).toContain(method)
  }
  expect(source).not.toContain('/add')
  expect(source).not.toContain('/edit')
  expect(source).not.toContain('/del')
  expect(source).not.toContain('/init')
  expect(source).not.toMatch(forbiddenLooseTypePattern)
  expect(source).toContain('function positiveID(')
  expect(source).toContain('const pageInit = async () => normalize')
  expect(source).toContain("request.delete<void, { ids: number[] }>")
  expect(source).toContain('{ data: { ids: normalizeIDs(params.ids) } }')
  expect(source).toContain('type AiCommonStatus = 1 | 2')
}

function expectCrudPage(source: string) {
  expect(source).toContain('<Search')
  expect(source).toContain('<AppTable')
  expect(source).toContain('<AppDialog')
  expect(source).toContain('useCrudTable')
  expect(source).not.toContain('<el-table')
  expect(source).not.toContain('<el-dialog')
  expect(source).not.toMatch(forbiddenLooseTypePattern)
  expect(source).not.toContain('return String(status)')
  expect(source).not.toContain('return type')
}

describe('AI prompt/asset Admin API and CRUD pages', () => {
  it('uses standard REST API clients without legacy aliases or loose types', () => {
    const prompts = readFrontendSource('src/api/ai/prompts.ts')
    const assets = readFrontendSource('src/api/ai/assets.ts')

    expectStandardCrudApi(prompts, 'ai-prompts')
    expectStandardCrudApi(assets, 'ai-assets')
    expect(prompts).toContain('changeStatus')
    expect(assets).not.toContain('changeStatus')
  })

  it('fails closed on page-init dictionaries and protects permission gates', () => {
    const prompts = readFrontendSource('src/api/ai/prompts.ts')
    const assets = readFrontendSource('src/api/ai/assets.ts')
    const promptPage = readFrontendSource('src/views/Main/ai/prompts/index.vue')
    const assetPage = readFrontendSource('src/views/Main/ai/assets/index.vue')

    expect(prompts).toContain('normalizeAiPromptInitResponse')
    expect(prompts).toContain("requireOptionArray<AiCommonStatus>(response.common_status_arr")
    expect(assets).toContain('normalizeAiAssetInitResponse')
    expect(assets).toContain("requireOptionArray<AiAssetType>(response.ai_asset_type_arr")
    for (const code of ['ai_prompt_add', 'ai_prompt_edit', 'ai_prompt_status', 'ai_prompt_del']) {
      expect(promptPage).toContain(`userStore.can('${code}')`)
    }
    for (const code of ['ai_asset_add', 'ai_asset_edit', 'ai_asset_del']) {
      expect(assetPage).toContain(`userStore.can('${code}')`)
    }
  })

  it('uses standard CRUD page primitives and keeps dynamic view registry generic', () => {
    const promptPage = readFrontendSource('src/views/Main/ai/prompts/index.vue')
    const assetPage = readFrontendSource('src/views/Main/ai/assets/index.vue')
    const viewRegistry = readFrontendSource('src/router/view-registry.ts')

    expectCrudPage(promptPage)
    expectCrudPage(assetPage)
    expect(viewRegistry).toContain("return `../views/Main/${normalizedPath}/index.vue`")
    expect(viewRegistry).not.toContain('ai/prompts')
    expect(viewRegistry).not.toContain('ai/assets')
  })
})
