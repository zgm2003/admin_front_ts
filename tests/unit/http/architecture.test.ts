import { readFileSync, readdirSync, statSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function sourceFiles(root: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(root)) {
    const path = resolve(root, entry)
    if (statSync(path).isDirectory()) {
      files.push(...sourceFiles(path))
    } else if (/\.(ts|vue)$/.test(path) && !path.includes(`${resolve('src/modules/http/generated')}`)) {
      files.push(path)
    }
  }
  return files
}

describe('HTTP architecture boundary', () => {
  it('keeps Axios imports private to the one transport adapter', () => {
    const violations = sourceFiles(resolve('src'))
      .filter((path) => relative(resolve('src'), path).replaceAll('\\', '/') !== 'modules/http/axios-adapter.ts')
      .filter((path) => /(?:from\s+|import\s*\()(['"])axios\1/.test(readFileSync(path, 'utf8')))
      .map((path) => relative(process.cwd(), path).replaceAll('\\', '/'))

    expect(violations).toEqual([])
  })

  it('exports only the typed compatibility request facade, never a raw service', () => {
    const source = readFileSync(resolve('src/lib/http/index.ts'), 'utf8')

    expect(source).toContain('installApiClient')
    expect(source).toContain('requireClient().execute')
    expect(source).not.toMatch(/export\s+\{[^}]*\bservice\b/)
  })

  it('keeps UI notification policy outside the transport module', () => {
    const moduleSource = sourceFiles(resolve('src/modules/http'))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n')

    expect(moduleSource).not.toContain('element-plus')
    expect(moduleSource).not.toContain('ElNotification')
    expect(moduleSource).not.toContain('ElMessage')
  })
})
