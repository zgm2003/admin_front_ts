export type ViewModuleLoader = () => Promise<{ default: object }>
export type ViewModuleMap = Record<string, ViewModuleLoader>

export function buildViewModuleKey(viewKey: string): string | null {
  if (!viewKey || typeof viewKey !== 'string') {
    return null
  }

  const normalizedPath = viewKey.replace(/^\/+/, '')
  if (!normalizedPath) {
    return null
  }

  return `../views/Main/${normalizedPath}/index.vue`
}

export function resolveViewComponent(modules: ViewModuleMap, viewKey: string): ViewModuleLoader | undefined {
  const moduleKey = buildViewModuleKey(viewKey)
  if (!moduleKey) {
    return undefined
  }

  return modules[moduleKey]
}
