import type { Router } from 'vue-router'
import { useMenuStore } from '@/store/menu'
import { useUserStore } from '@/store/user'
import {
  createRuntimeBeforeEachGuard,
  type RoutingKernel,
} from '@/modules/routing/guards'

export function registerRouterGuards(
  router: Pick<Router, 'beforeEach' | 'afterEach'>,
  kernel: RoutingKernel,
) {
  const beforeEach = createRuntimeBeforeEachGuard(kernel)
  router.beforeEach((to) => beforeEach(to))

  router.afterEach((to) => {
    const menuStore = useMenuStore()
    const userStore = useUserStore()
    const menuId = typeof to.meta.menuId === 'string' ? to.meta.menuId : ''

    menuStore.selectedMenu = menuId
    if (!menuId) return
    const item = userStore.permissionMap.get(menuId)
    if (item) menuStore.selectMenu(item)
  })
}
