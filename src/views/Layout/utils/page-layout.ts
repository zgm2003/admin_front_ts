import type { RouteMeta } from 'vue-router'

export type PageLayout = 'card' | 'plain' | 'centered'

export function resolvePageLayout(meta?: Pick<RouteMeta, 'pageLayout'> | null): PageLayout {
  return meta?.pageLayout ?? 'card'
}
