import { createRouter, createWebHistory, type RouterHistory } from 'vue-router'
import { useMenuStore } from '@/store/menu'
import { createMainRoute, publicRoutes } from '@/router/routes'

export function createAdminRouter(history: RouterHistory = createWebHistory()) {
  return createRouter({
    history,
    routes: [...publicRoutes, createMainRoute()],
  })
}

const router = createAdminRouter()

export async function refreshCurrentRoute(): Promise<void> {
  useMenuStore().refreshCurrentPage()
}

export default router
