import 'vue-router'
import type { PermissionCode } from '@/modules/routing/generated/permissions'

declare module 'vue-router' {
  interface RouteMeta {
    menuId?: string
    titleKey?: string
    showMenu?: boolean
    permission?: PermissionCode
    pageLayout?: 'card' | 'plain' | 'full' | 'centered'
    errorKind?: 'not-found' | 'dead'
    deadRoutePath?: string
    deadViewKey?: string
  }
}
