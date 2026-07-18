import type { RouteMeta, RouteRecordRaw } from 'vue-router'
import type { DynamicRouteItem } from '@/types/user'
import { resolveViewComponent } from '@/router/view-registry'

export function buildRuntimeRouteTree(routes: readonly DynamicRouteItem[]): RouteRecordRaw[] {
  const records: RouteRecordRaw[] = []
  for (const route of routes) {
    const component = resolveViewComponent(route.view_key)
    if (!component) continue
    const meta = { ...route.meta } as RouteMeta
    records.push({
      path: route.path,
      name: route.name,
      component,
      meta: {
        ...meta,
        pageLayout: meta.pageLayout ?? 'card',
      },
    })
  }
  return records
}
