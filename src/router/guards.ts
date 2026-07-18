import type { Router } from 'vue-router'
import type { Pinia } from 'pinia'
import type { MenuIdentityPersistence } from '@/modules/persistence/menu-state'
import { useMenuStore } from '@/store/menu'
import { useUserStore } from '@/store/user'
import {
  createRuntimeBeforeEachGuard,
  type RoutingKernel,
} from '@/modules/routing/guards'

export function registerRouterGuards(
  router: Pick<Router, 'beforeEach' | 'afterEach'>,
  kernel: RoutingKernel,
  options: {
    readonly pinia?: Pinia
    readonly menuPersistence?: MenuIdentityPersistence
  } = {},
) {
  const beforeEach = createRuntimeBeforeEachGuard(kernel)
  const removeBeforeEach = router.beforeEach((to) => beforeEach(to))

  const removeAfterEach = router.afterEach((to) => {
    const menuStore = useMenuStore(options.pinia)
    const userStore = useUserStore(options.pinia)
    const menuId = typeof to.meta.menuId === 'string' ? to.meta.menuId : ''

    menuStore.selectedMenu = menuId
    if (!menuId) return
    const item = userStore.permissionMap.get(menuId)
    if (item) menuStore.selectMenu(item)
    options.menuPersistence?.setLastRoute(to.fullPath)
  })

  return () => {
    removeBeforeEach()
    removeAfterEach()
  }
}
