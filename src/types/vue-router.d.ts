import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    menuId?: string
    pageLayout?: 'card' | 'plain' | 'centered'
    errorKind?: 'not-found' | 'dead'
    deadRoutePath?: string
    deadViewKey?: string
  }
}
