import type { RouteMeta, RouteRecordRaw } from 'vue-router'
import DeadPage from '@/views/Error/DeadPage.vue'
import type { DynamicRouteItem } from '@/types/user'
import { resolveViewComponent, type ViewModuleMap } from '@/router/view-registry'

export function buildRuntimeRouteTree(routes: DynamicRouteItem[], modules: ViewModuleMap): RouteRecordRaw[] {
  return routes.map((route) => {
    const component = resolveViewComponent(modules, route.view_key)
    const meta = { ...(route.meta || {}) } as RouteMeta

    if (component) {
      return {
        path: route.path,
        name: route.name,
        component,
        meta: {
          ...meta,
          pageLayout: meta.pageLayout ?? 'card',
        },
      }
    }

    return {
      path: route.path,
      name: route.name,
      component: DeadPage,
      meta: {
        ...meta,
        pageLayout: 'centered',
        errorKind: 'dead',
        deadRoutePath: route.path,
        deadViewKey: route.view_key,
      },
    }
  })
}
