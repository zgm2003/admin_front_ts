import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

interface GuardedFile {
  label: string
  path: string
}

interface SourceRule {
  name: string
  pattern: RegExp
}

interface ExactRule {
  file: GuardedFile
  text: string
}

interface SourceViolation {
  file: string
  line: number
  rule: string
  source: string
}

const guardedFiles: GuardedFile[] = [
  { label: 'Table', path: 'src/components/Table/src/index.vue' },
  { label: 'Table types', path: 'src/components/Table/src/types.ts' },
  { label: 'ColumnSetting', path: 'src/components/Table/src/components/ColumnSetting.vue' },
  { label: 'Search', path: 'src/components/Search/src/index.vue' },
  { label: 'Search types', path: 'src/components/Search/types.ts' },
  { label: 'common types', path: 'src/types/common.ts' },
]

const primitiveRules: SourceRule[] = [
  { name: 'any', pattern: /\bany\b/ },
  { name: 'as any', pattern: /\bas\s+any\b/ },
  { name: 'Record<string, any>', pattern: /\bRecord\s*<\s*string\s*,\s*any\s*>/ },
]

const exactRules: ExactRule[] = [
  {
    file: guardedFiles[3],
    text: 'Object.assign(form, value || {})',
  },
  {
    file: guardedFiles[3],
    text: '(field.options ?? []) as any[]',
  },
  {
    file: guardedFiles[0],
    text: 'page as any',
  },
  {
    file: guardedFiles[5],
    text: 'params: any',
  },
  {
    file: guardedFiles[1],
    text: '[elementTableColumnProp: string]: unknown',
  },
  {
    file: guardedFiles[4],
    text: '[key: string]: unknown',
  },
]

const readSource = (file: GuardedFile) => readFileSync(resolve(process.cwd(), file.path), 'utf8')

const findViolations = (file: GuardedFile, rules: SourceRule[]): SourceViolation[] =>
  readSource(file)
    .split(/\r?\n/)
    .flatMap((line, index) =>
      rules
        .filter((rule) => rule.pattern.test(line))
        .map((rule) => ({
          file: file.path,
          line: index + 1,
          rule: rule.name,
          source: line.trim(),
        }))
    )

const findExactViolations = (rule: ExactRule): SourceViolation[] =>
  readSource(rule.file)
    .split(/\r?\n/)
    .flatMap((line, index) =>
      line.includes(rule.text)
        ? [
            {
              file: rule.file.path,
              line: index + 1,
              rule: rule.text,
              source: line.trim(),
            },
          ]
        : []
    )

describe('shared table and search primitive source quality', () => {
  it('does not keep any, as any, or Record<string, any> in shared primitives', () => {
    const violations = guardedFiles.flatMap((file) => findViolations(file, primitiveRules))

    expect(violations).toEqual([])
  })

  it('does not keep source fallbacks that hide broken shared primitive contracts', () => {
    const violations = exactRules.flatMap(findExactViolations)

    expect(violations).toEqual([])
  })

  it('uses explicit typed elementProps extension points', () => {
    expect(readSource(guardedFiles[1])).toContain('elementProps?:')
    expect(readSource(guardedFiles[4])).toContain('elementProps?:')
    expect(readSource(guardedFiles[0])).toContain('col.elementProps')
    expect(readSource(guardedFiles[3])).toContain('field.elementProps')
  })

  it('typechecks closed column and model-bound search contracts', () => {
    const configPath = resolve(process.cwd(), 'tsconfig.app.json')
    const config = ts.readConfigFile(configPath, ts.sys.readFile)
    expect(config.error).toBeUndefined()
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd(), {
      composite: false,
      incremental: false,
      noEmit: true,
      skipLibCheck: true,
    })
    const fixture = resolve(
      process.cwd(),
      'tests/shared/table/fixtures/shared-primitives-types.ts',
    )
    const program = ts.createProgram({ rootNames: [fixture], options: parsed.options })
    const diagnostics = ts.getPreEmitDiagnostics(program)
    const output = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => '\n',
    })

    expect(output).toBe('')
  }, 30_000)
})
