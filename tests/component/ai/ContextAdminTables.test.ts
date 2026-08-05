import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const componentFiles = [
  'ContextSpacePanel.vue',
  'ContextDocumentPanel.vue',
  'ContextProfilePanel.vue',
  'ContextEvaluationPanel.vue',
]

function readComponent(filename: string) {
  return readFileSync(resolve(
    'src/views/Main/ai/context/components',
    filename,
  ), 'utf8')
}

describe('context administration tables', () => {
  it.each(componentFiles.map(filename => [filename]))('uses AppTable without local deep overrides in %s', (filename) => {
    const source = readComponent(filename)

    expect(source).toContain("import { AppTable } from '@/components/Table'")
    expect(source).toContain('<AppTable')
    expect(source).not.toContain('<el-table')
    expect(source).not.toContain(':deep')
  })

  it('keeps the space date and action columns wide enough for one line', () => {
    const source = readComponent('ContextSpacePanel.vue')

    expect(source).toMatch(/prop:\s*'updated_at'[\s\S]*?width:\s*240/)
    expect(source).toMatch(/key:\s*'actions'[\s\S]*?width:\s*180/)
  })

  it('uses registered action translations for document status commands', () => {
    const source = readComponent('ContextDocumentPanel.vue')

    expect(source).toContain("t('common.actions.disable')")
    expect(source).toContain("t('common.actions.enable')")
    expect(source).not.toContain("t('common.status.disable')")
    expect(source).not.toContain("t('common.status.enable')")
  })

  it('truncates long document version filenames on one line', () => {
    const source = readComponent('ContextDocumentPanel.vue')

    expect(source).toContain('class="version-row__filename"')
    expect(source).toMatch(/\.version-row__filename\s*\{[\s\S]*?overflow:\s*hidden;[\s\S]*?text-overflow:\s*ellipsis;[\s\S]*?white-space:\s*nowrap;/)
  })

  it('loads Context Page Init once and passes its three typed option sets to the profile dialog', () => {
    const api = readFileSync(resolve('src/api/ai/context.ts'), 'utf8')
    const workspace = readFileSync(resolve('src/views/Main/ai/context/use-context-workspace.ts'), 'utf8')
    const page = readFileSync(resolve('src/views/Main/ai/context/index.vue'), 'utf8')
    const panel = readComponent('ContextProfilePanel.vue')
    const dialog = readComponent('ContextProfileDialog.vue')

    expect(api).toContain("export type AiContextPageInit = Output<'ai_context_page_init'>")
    expect(api).toContain('adminOperations.ai_context_page_init')
    expect(workspace.match(/AiContextApi\.pageInit\(\)/g)).toHaveLength(1)
    expect(page).toContain(':embedding-model-options="workspace.embeddingModelOptions.value"')
    expect(page).toContain(':reranker-model-options="workspace.rerankerModelOptions.value"')
    expect(page).toContain(':memory-model-options="workspace.memoryModelOptions.value"')
    expect(panel).toContain(':embedding-model-options="embeddingModelOptions"')
    expect(dialog).not.toContain(':deep')
  })
})
