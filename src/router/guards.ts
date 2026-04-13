import Cookies from 'js-cookie'
import { useMenuStore } from '@/store/menu'
import { useUserStore } from '@/store/user'
import type { Router } from 'vue-router'
import { isPublicRouteName, shouldRedirectToLogin } from './guard-helpers'

export function registerRouterGuards(router: Router) {
  router.beforeEach((to, _from, next) => {
    const accessToken = Cookies.get('access_token')
    const refreshToken = Cookies.get('refresh_token')

    if (shouldRedirectToLogin({
      routeName: to.name,
      accessToken,
      refreshToken,
    })) {
      return next('/login')
    }

    if (!isPublicRouteName(to.name)) {
      localStorage.setItem('lastVisitedPath', to.fullPath)
    }

    next()
  })

  router.afterEach((to) => {
    const menuStore = useMenuStore()
    const userStore = useUserStore()
    const menuId = (to.meta.menuId as string) || ''

    menuStore.selectedMenu = menuId
    if (menuId) {
      localStorage.setItem('selectedMenu', menuId)
      const item = userStore.permissionMap.get(menuId)
      if (item) {
        menuStore.selectMenu(item)
      }
    }
  })
}
