import { readFileSync, readdirSync, statSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const adapterPath = 'src/adapters/web/storage.ts'
const taskEightCredentialCutover = new Set([
  'src/i18n/index.ts',
  'src/lib/http/auth-session.ts',
  'src/lib/http/headers.ts',
  'src/lib/http/platform.ts',
  'src/main.ts',
  'src/router/index.ts',
  'src/utils/storage.ts',
  'src/views/Layout/components/Aside/index.vue',
  'src/views/Layout/components/Header/components/SettingDrawer.vue',
  'src/views/Layout/components/Header/index.vue',
  'src/views/Login/composables/useLoginForm.ts',
])

const taskEightPreferenceCutover = new Set([
  'src/hooks/useTheme.ts',
  'src/store/tauri.ts',
  'src/views/Main/ai/chat/composables/useAgents.ts',
  'src/views/Main/test/index.vue',
])

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
  it('allows no new direct browser storage or cookie callers during the Task 8 cutover', () => {
    const violations = sourceFiles(resolve('src'))
      .map((path) => ({
        path: relative(process.cwd(), path).replaceAll('\\', '/'),
        source: readFileSync(path, 'utf8'),
      }))
      .filter(({ path, source }) => (
        path !== adapterPath
        && !taskEightCredentialCutover.has(path)
        && !taskEightPreferenceCutover.has(path)
        && /\blocalStorage\b|\bsessionStorage\b|document\.cookie|from ['"]js-cookie['"]/.test(source)
      ))
      .map(({ path }) => path)

    expect(violations).toEqual([])
  })

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
