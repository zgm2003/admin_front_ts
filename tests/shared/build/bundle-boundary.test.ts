import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const analyzerPath = resolve(process.cwd(), 'scripts/analyze-bundle.mjs')
const budgetsPath = resolve(process.cwd(), 'performance/budgets.json')
const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('bundle analyzer', () => {
  it('ships the exact compressed budgets from the P07 contract', async () => {
    expect(existsSync(budgetsPath)).toBe(true)
    if (!existsSync(budgetsPath)) return

    const budgets = JSON.parse(await import('node:fs/promises').then(({ readFile }) => readFile(budgetsPath, 'utf8')))
    expect(budgets).toEqual({
      initialJs: { gzip: 307200, brotli: 256000 },
      initialCss: { gzip: 153600, brotli: 128000 },
      largestLazyJs: { gzip: 307200, brotli: 256000 },
      totalJs: { gzip: 1572864, brotli: 1258291 },
      forbiddenInitialModules: [
        '@wangeditor',
        'cos-js-sdk-v5',
        'markdown-it',
        'highlight.js',
      ],
    })
    const packageJson = JSON.parse(await import('node:fs/promises')
      .then(({ readFile }) => readFile(resolve(process.cwd(), 'package.json'), 'utf8')))
    expect(packageJson.perfBudget).toBeUndefined()
  })

  it('measures static and lazy chunks and reports forbidden initial modules', async () => {
    expect(existsSync(analyzerPath)).toBe(true)
    if (!existsSync(analyzerPath)) return

    const directory = join(tmpdir(), `admin-bundle-${process.pid}-${Date.now()}`)
    temporaryDirectories.push(directory)
    mkdirSync(join(directory, 'assets'), { recursive: true })
    writeFileSync(join(directory, 'assets/entry.js'), 'import "./shared.js"; console.log("entry")')
    writeFileSync(join(directory, 'assets/shared.js'), 'console.log("shared")')
    writeFileSync(join(directory, 'assets/lazy.js'), 'console.log("lazy")')
    writeFileSync(join(directory, 'assets/entry.css'), '.app{display:block}')
    writeFileSync(join(directory, 'bundle-metadata.json'), JSON.stringify({
      schemaVersion: 1,
      chunks: [
        {
          file: 'assets/entry.js',
          isEntry: true,
          isDynamicEntry: false,
          imports: ['assets/shared.js'],
          dynamicImports: ['assets/lazy.js'],
          css: ['assets/entry.css'],
          modules: ['src/main.ts', 'node_modules/markdown-it/index.mjs'],
        },
        {
          file: 'assets/shared.js',
          isEntry: false,
          isDynamicEntry: false,
          imports: [],
          dynamicImports: [],
          css: [],
          modules: ['src/shared.ts'],
        },
        {
          file: 'assets/lazy.js',
          isEntry: false,
          isDynamicEntry: true,
          imports: [],
          dynamicImports: [],
          css: [],
          modules: ['src/lazy.ts'],
        },
      ],
    }))

    const analyzer = await import('../../../scripts/analyze-bundle.mjs')
    expect(analyzer.analyzeBuildDirectory).toBeTypeOf('function')
    expect(analyzer.findBudgetViolations).toBeTypeOf('function')
    if (typeof analyzer.analyzeBuildDirectory !== 'function'
      || typeof analyzer.findBudgetViolations !== 'function') return

    const report = await analyzer.analyzeBuildDirectory(directory)
    expect(report.initialFiles).toEqual([
      'assets/entry.css',
      'assets/entry.js',
      'assets/shared.js',
    ])
    expect(report.lazyJsFiles).toEqual(['assets/lazy.js'])
    expect(report.summary.initialJs.raw).toBeGreaterThan(0)
    expect(report.summary.initialCss.raw).toBeGreaterThan(0)
    expect(report.summary.totalJs.raw).toBeGreaterThan(report.summary.initialJs.raw)

    const violations = analyzer.findBudgetViolations(report, {
      initialJs: { gzip: Number.MAX_SAFE_INTEGER, brotli: Number.MAX_SAFE_INTEGER },
      initialCss: { gzip: Number.MAX_SAFE_INTEGER, brotli: Number.MAX_SAFE_INTEGER },
      largestLazyJs: { gzip: Number.MAX_SAFE_INTEGER, brotli: Number.MAX_SAFE_INTEGER },
      totalJs: { gzip: Number.MAX_SAFE_INTEGER, brotli: Number.MAX_SAFE_INTEGER },
      forbiddenInitialModules: ['markdown-it'],
    })
    expect(violations).toEqual([
      expect.stringContaining('markdown-it'),
    ])
  })
})
