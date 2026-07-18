import { resolve } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

describe('shared table and search type contracts', () => {
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
