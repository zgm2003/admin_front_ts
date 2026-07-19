import { createI18n } from 'vue-i18n'
import type { Router } from 'vue-router'
import enCommon from './locales/en-US/common'
import enAuth from './locales/en-US/auth'
import enLayout from './locales/en-US/layout'
import zhCommon from './locales/zh-CN/common'
import zhAuth from './locales/zh-CN/auth'
import zhLayout from './locales/zh-CN/layout'
import type { AdminLocale, FeatureLocaleDomain } from './locales/generated'

const messages = {
  'en-US': { ...enCommon, ...enAuth, ...enLayout },
  'zh-CN': { ...zhCommon, ...zhAuth, ...zhLayout },
}

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages,
})

const featureLocaleLoaders = {
  'en-US': {
    user: () => import('./locales/en-US/user'),
    permission: () => import('./locales/en-US/permission'),
    system: () => import('./locales/en-US/system'),
    payment: () => import('./locales/en-US/payment'),
    ai: () => import('./locales/en-US/ai'),
  },
  'zh-CN': {
    user: () => import('./locales/zh-CN/user'),
    permission: () => import('./locales/zh-CN/permission'),
    system: () => import('./locales/zh-CN/system'),
    payment: () => import('./locales/zh-CN/payment'),
    ai: () => import('./locales/zh-CN/ai'),
  },
} satisfies Record<AdminLocale, Record<FeatureLocaleDomain, () => Promise<{ default: object }>>>

const loadedDomains = new Set<string>()
const loadingDomains = new Map<string, Promise<void>>()

function domainKey(locale: AdminLocale, domain: FeatureLocaleDomain) {
  return `${locale}:${domain}`
}

async function loadFeatureLocaleDomain(locale: AdminLocale, domain: FeatureLocaleDomain) {
  const key = domainKey(locale, domain)
  if (loadedDomains.has(key)) return
  const existing = loadingDomains.get(key)
  if (existing) return existing

  const loading = featureLocaleLoaders[locale][domain]()
    .then((module) => {
      i18n.global.mergeLocaleMessage(locale, module.default)
      loadedDomains.add(key)
    })
    .finally(() => loadingDomains.delete(key))
  loadingDomains.set(key, loading)
  return loading
}

function hasPathPrefix(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`)
}

export function localeDomainForPath(path: string): FeatureLocaleDomain | null {
  if (hasPathPrefix(path, '/ai')) return 'ai'
  if (hasPathPrefix(path, '/payment')) return 'payment'
  if (hasPathPrefix(path, '/permission')) return 'permission'
  if (hasPathPrefix(path, '/system') || hasPathPrefix(path, '/notification')) return 'system'
  if (hasPathPrefix(path, '/user')
    || hasPathPrefix(path, '/personal')
    || hasPathPrefix(path, '/profile')) return 'user'
  return null
}

export async function ensureLocaleForRoute(locale: AdminLocale, path: string): Promise<void> {
  const domain = localeDomainForPath(path)
  if (domain) await loadFeatureLocaleDomain(locale, domain)
}

export async function setAdminLocale(locale: AdminLocale, currentPath: string): Promise<void> {
  await ensureLocaleForRoute(locale, currentPath)
  i18n.global.locale.value = locale
}

export function registerLocaleRouteGuard(router: Router): () => void {
  return router.beforeEach(async (to) => {
    await ensureLocaleForRoute(i18n.global.locale.value, to.path)
  })
}

export default i18n
