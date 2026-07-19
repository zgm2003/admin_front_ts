import { readFileSync, readdirSync, statSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const adapterPath = 'src/adapters/web/storage.ts'

function sourceFiles(root: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(root)) {
    const path = resolve(root, entry)
    if (statSync(path).isDirectory()) files.push(...sourceFiles(path))
    else if (/\.(ts|vue)$/.test(path)) files.push(path)
  }
  return files
}

describe('storage architecture boundary', () => {
  it('allows browser storage access only inside the web storage adapter', () => {
    const violations = sourceFiles(resolve('src'))
      .map((path) => ({
        path: relative(process.cwd(), path).replaceAll('\\', '/'),
        source: readFileSync(path, 'utf8'),
      }))
      .filter(({ path, source }) => (
        path !== adapterPath
        && /\blocalStorage\b|\bsessionStorage\b|document\.cookie|from ['"]js-cookie['"]/.test(source)
      ))
      .map(({ path }) => path)

    expect(violations).toEqual([])
  }, 15_000)

  it('keeps menu and device access behind Persistence immediately', () => {
    for (const path of ['src/store/menu.ts', 'src/lib/http/device.ts']) {
      const source = readFileSync(resolve(path), 'utf8')
      expect(source).not.toMatch(/\blocalStorage\b|\bsessionStorage\b|document\.cookie|js-cookie/)
    }
  })

  it('does not allow the web storage adapter to encode credential concepts', () => {
    const source = readFileSync(resolve(adapterPath), 'utf8')
    expect(source).not.toMatch(/access[_-]?token|refresh[_-]?token|credential|principal/i)
  })
})
