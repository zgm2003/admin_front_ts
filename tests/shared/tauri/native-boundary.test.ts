import { readFile, readdir } from 'node:fs/promises'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const sourceRoot = resolve(repositoryRoot, 'src')
const tauriAdapter = 'src/adapters/tauri/native-bridge.ts'

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return ['.ts', '.vue'].includes(extname(entry.name)) ? [path] : []
  }))
  return nested.flat()
}

describe('NativeBridge architecture boundary', () => {
  it('keeps every Tauri package import and raw invoke inside the one adapter', async () => {
    const violations: string[] = []
    for (const path of await sourceFiles(sourceRoot)) {
      const relativePath = relative(repositoryRoot, path).replaceAll('\\', '/')
      const source = await readFile(path, 'utf8')
      if (relativePath !== tauriAdapter && /@tauri-apps|\binvoke\s*\(/.test(source)) {
        violations.push(relativePath)
      }
    }
    expect(violations).toEqual([])
  })

  it('removes global Tauri probing, the legacy platform facade, and unsafe window messaging', async () => {
    const violations: string[] = []
    for (const path of await sourceFiles(sourceRoot)) {
      const relativePath = relative(repositoryRoot, path).replaceAll('\\', '/')
      const source = await readFile(path, 'utf8')
      if (/__TAURI__/.test(source)) violations.push(`${relativePath}: global`)
      if (/postMessage\s*\([^,]+,\s*['"]\*['"]/.test(source)) violations.push(`${relativePath}: postMessage`)
      if (relativePath !== tauriAdapter && /\bwindow\.open\s*\(/.test(source)) {
        violations.push(`${relativePath}: window.open`)
      }
    }
    expect(violations).toEqual([])
    const legacyEntries = await readdir(resolve(sourceRoot, 'platform/tauri')).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return []
      throw error
    })
    expect(legacyEntries).toEqual([])
  })

  it('exposes no catch-all invoke and uses literal command names in the Tauri adapter', async () => {
    const typeSource = await readFile(resolve(sourceRoot, 'modules/native/types.ts'), 'utf8').catch(() => '')
    const adapterSource = await readFile(resolve(repositoryRoot, tauriAdapter), 'utf8').catch(() => '')

    expect(typeSource).toContain('export interface NativeBridge')
    expect(typeSource).not.toMatch(/\binvoke\s*\(/)
    const invokeCalls = [...adapterSource.matchAll(/\binvoke(?:<[^>]+>)?\s*\(/g)]
    const literalInvokeCalls = [...adapterSource.matchAll(
      /\binvoke(?:<[^>]+>)?\s*\(\s*['"][a-z0-9_:-]+['"]/g,
    )]
    expect(invokeCalls.length).toBeGreaterThan(0)
    expect(literalInvokeCalls).toHaveLength(invokeCalls.length)
  })
})
