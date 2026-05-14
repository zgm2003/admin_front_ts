import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import zhCN from '../../../src/i18n/locales/zh-CN'
import enUS from '../../../src/i18n/locales/en-US'

type LocaleTree = Record<string, unknown>

function flatten(value: unknown, prefix = '', out = new Set<string>()) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    if (prefix) out.add(prefix)
    return out
  }
  for (const [key, child] of Object.entries(value as LocaleTree)) {
    flatten(child, prefix ? `${prefix}.${key}` : key, out)
  }
  return out
}

function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name)
    const stat = statSync(file)
    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', '.git'].includes(name)) walk(file, out)
      continue
    }
    if (/\.(vue|ts|tsx|js|jsx)$/.test(name)) out.push(file)
  }
  return out
}

function literalI18nKeys(source: string) {
  const keys = new Set<string>()
  const patterns = [
    /\bt\(\s*['"]([^'"`]+)['"]/g,
    /\$t\(\s*['"]([^'"`]+)['"]/g,
    /i18n\.global\.t\(\s*['"]([^'"`]+)['"]/g,
  ]
  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source))) keys.add(match[1])
  }
  return [...keys]
}

describe('frontend i18n literal keys', () => {
  it('keeps zh-CN and en-US locale key sets aligned', () => {
    const zhKeys = flatten(zhCN)
    const enKeys = flatten(enUS)

    expect([...enKeys].filter((key) => !zhKeys.has(key))).toEqual([])
    expect([...zhKeys].filter((key) => !enKeys.has(key))).toEqual([])
  })

  it('does not reference missing literal i18n keys', () => {
    const srcRoot = join(process.cwd(), 'src')
    const localeRoot = join(srcRoot, 'i18n', 'locales')
    const zhKeys = flatten(zhCN)
    const enKeys = flatten(enUS)
    const missing: string[] = []

    for (const file of walk(srcRoot)) {
      if (file.startsWith(localeRoot)) continue
      const source = readFileSync(file, 'utf8')
      for (const key of literalI18nKeys(source)) {
        if (!zhKeys.has(key) || !enKeys.has(key)) {
          missing.push(`${relative(process.cwd(), file).replace(/\\/g, '/')}: ${key}`)
        }
      }
    }

    expect(missing).toEqual([])
  })
})
