import { describe, expect, it } from 'vitest'
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

describe('frontend i18n literal keys', () => {
  it('keeps zh-CN and en-US locale key sets aligned', () => {
    const zhKeys = flatten(zhCN)
    const enKeys = flatten(enUS)

    expect([...enKeys].filter((key) => !zhKeys.has(key))).toEqual([])
    expect([...zhKeys].filter((key) => !enKeys.has(key))).toEqual([])
  })

})
