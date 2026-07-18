import type { BackendViewKey } from './generated/views'
import { backendViewDescriptors } from './generated/views'
import { parseRuntimeRoute, type RuntimeRoute } from './contracts'

export interface PrincipalRouteContract {
  readonly name: string
  readonly path: string
  readonly view_key: BackendViewKey
  readonly meta: Readonly<Record<string, string>>
}

export function mapPrincipalRoutes(routes: readonly PrincipalRouteContract[]): readonly RuntimeRoute[] {
  return routes.map((route) => {
    const descriptor = backendViewDescriptors[route.view_key]
    if (route.path !== descriptor.path) {
      throw new Error(`users/me route ${route.name} path conflicts with view_key ${route.view_key}`)
    }
    const menuId = route.meta.menuId
    if (typeof menuId !== 'string' || !menuId.trim()) {
      throw new Error(`users/me route ${route.name} is missing meta.menuId`)
    }
    return parseRuntimeRoute({
      name: route.name,
      path: route.path,
      parentName: null,
      viewKey: route.view_key,
      menuId,
      meta: {
        titleKey: descriptor.titleKey,
        showMenu: descriptor.showMenu,
        pageLayout: 'card',
      },
    })
  })
}
