import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  const path = resolve(process.cwd(), relativePath)
  expect(existsSync(path), `${relativePath} should exist`).toBe(true)
  return readFileSync(path, 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

function expectStandardCrudApi(source: string, resource: 'ai-prompts') {
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

describe('AI prompt Admin API and CRUD page', () => {
  it('uses standard REST API clients without legacy aliases or loose types', () => {
    const prompts = readFrontendSource('src/api/ai/prompts.ts')

    expectStandardCrudApi(prompts, 'ai-prompts')
    expect(prompts).toContain('changeStatus')
  })

  it('fails closed on page-init dictionaries and protects permission gates', () => {
    const prompts = readFrontendSource('src/api/ai/prompts.ts')
    const promptPage = readFrontendSource('src/views/Main/ai/prompts/index.vue')

    expect(prompts).toContain('normalizeAiPromptInitResponse')
    expect(prompts).toContain("requireOptionArray<AiCommonStatus>(response.common_status_arr")
    for (const code of ['ai_prompt_add', 'ai_prompt_edit', 'ai_prompt_status', 'ai_prompt_del']) {
      expect(promptPage).toContain(`userStore.can('${code}')`)
    }
  })

  it('uses standard CRUD page primitives and keeps dynamic view registry generic', () => {
    const promptPage = readFrontendSource('src/views/Main/ai/prompts/index.vue')
    const viewRegistry = readFrontendSource('src/router/view-registry.ts')

    expectCrudPage(promptPage)
    expect(viewRegistry).toContain("return `../views/Main/${normalizedPath}/index.vue`")
    expect(viewRegistry).not.toContain('ai/prompts')
    expect(viewRegistry).not.toContain('ai/assets')
  })

  it('guards table dictionary labels before rendering status and type cells', () => {
    const promptPage = readFrontendSource('src/views/Main/ai/prompts/index.vue')

    expect(promptPage).toContain('function isKnownStatus(')
    expect(promptPage).toContain('v-if="isKnownStatus(row.status)"')
  })
})
