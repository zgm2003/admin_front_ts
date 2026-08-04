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
})
