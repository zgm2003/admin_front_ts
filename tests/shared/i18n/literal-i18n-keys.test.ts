import { describe, expect, it } from 'vitest'
import enCommon from '../../../src/i18n/locales/en-US/common'
import enAuth from '../../../src/i18n/locales/en-US/auth'
import enLayout from '../../../src/i18n/locales/en-US/layout'
import enUser from '../../../src/i18n/locales/en-US/user'
import enPermission from '../../../src/i18n/locales/en-US/permission'
import enSystem from '../../../src/i18n/locales/en-US/system'
import enPayment from '../../../src/i18n/locales/en-US/payment'
import enAi from '../../../src/i18n/locales/en-US/ai'
import zhCommon from '../../../src/i18n/locales/zh-CN/common'
import zhAuth from '../../../src/i18n/locales/zh-CN/auth'
import zhLayout from '../../../src/i18n/locales/zh-CN/layout'
import zhUser from '../../../src/i18n/locales/zh-CN/user'
import zhPermission from '../../../src/i18n/locales/zh-CN/permission'
import zhSystem from '../../../src/i18n/locales/zh-CN/system'
import zhPayment from '../../../src/i18n/locales/zh-CN/payment'
import zhAi from '../../../src/i18n/locales/zh-CN/ai'

const enUS = { ...enCommon, ...enAuth, ...enLayout, ...enUser, ...enPermission, ...enSystem, ...enPayment, ...enAi }
const zhCN = { ...zhCommon, ...zhAuth, ...zhLayout, ...zhUser, ...zhPermission, ...zhSystem, ...zhPayment, ...zhAi }

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
