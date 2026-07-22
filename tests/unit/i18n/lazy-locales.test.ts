import { describe, expect, it } from 'vitest'
import type { NavigationGuard, Router } from 'vue-router'

describe('lazy locale domains', () => {
  it('maps protected routes to one closed feature domain', async () => {
    const localeModule = await import('@/i18n')
    expect(localeModule.localeDomainForPath).toBeTypeOf('function')
    if (typeof localeModule.localeDomainForPath !== 'function') return

    expect(localeModule.localeDomainForPath('/ai/chat')).toBe('ai')
    expect(localeModule.localeDomainForPath('/payment/config')).toBe('payment')
    expect(localeModule.localeDomainForPath('/permission/role')).toBe('permission')
    expect(localeModule.localeDomainForPath('/system/mail')).toBe('system')
    expect(localeModule.localeDomainForPath('/user/userManager')).toBe('user')
    expect(localeModule.localeDomainForPath('/personal')).toBe('user')
    expect(localeModule.localeDomainForPath('/profile/wallet')).toBe('payment')
    expect(localeModule.localeDomainForPath('/profile/wallet/ledger')).toBe('payment')
    expect(localeModule.localeDomainForPath('/profile/security')).toBe('user')
    expect(localeModule.localeDomainForPath('/profile/wallets')).toBe('user')
    expect(localeModule.localeDomainForPath('/notification')).toBe('system')
    expect(localeModule.localeDomainForPath('/home')).toBeNull()
  })

  it('loads payment messages for the profile wallet route', async () => {
    const localeModule = await import('@/i18n')

    await localeModule.ensureLocaleForRoute('zh-CN', '/profile/wallet')

    expect(localeModule.default.global.t('wallet.summary')).toBe('钱包概览')
    expect(localeModule.default.global.t('wallet.balance')).toBe('当前余额')
  })

  it('loads a feature domain once before activating its route', async () => {
    const localeModule = await import('@/i18n')
    expect(localeModule.ensureLocaleForRoute).toBeTypeOf('function')
    if (typeof localeModule.ensureLocaleForRoute !== 'function') return

    await localeModule.ensureLocaleForRoute('en-US', '/ai/chat')
    const first = localeModule.default.global.getLocaleMessage('en-US')
    expect(first.aiChat).toBeTypeOf('object')

    await localeModule.ensureLocaleForRoute('en-US', '/ai/providers')
    const second = localeModule.default.global.getLocaleMessage('en-US')
    expect(second.aiChat).toBe(first.aiChat)
  })

  it('registers before route component resolution begins', async () => {
    const localeModule = await import('@/i18n')
    let guard: NavigationGuard | undefined
    const router = {
      beforeEach(candidate: NavigationGuard) {
        guard = candidate
        return () => undefined
      },
    } as unknown as Router

    const unregister = localeModule.registerLocaleRouteGuard(router)
    expect(guard).toBeTypeOf('function')
    expect(unregister).toBeTypeOf('function')
  })
})
