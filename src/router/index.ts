import {createRouter, createWebHistory} from 'vue-router'
import Cookies from 'js-cookie'
import {useUserStore} from '@/store/user'
import {useMenuStore} from '@/store/menu'
import { baseChildren, createCatchAllRoute, createMainRoute, publicRoutes } from '@/router/routes'
import type { DynamicRouteItem } from '@/types/user'
import { resolveCurrentRouteTarget, resolveRouteRestoreTarget } from '@/router/guard-helpers'
import { buildRuntimeRouteTree } from '@/router/runtime-route-tree'

const mainRoute = createMainRoute()
const router = createRouter({history: createWebHistory(), routes: [...publicRoutes, mainRoute]})

export function createAdminRouter() {
    return createRouter({
        history: createWebHistory(),
        routes: [...publicRoutes, createMainRoute()],
    })
}

export async function setupDynamicRoutes() {
    mainRoute.children = [...baseChildren]
    router.addRoute(mainRoute)

    // 先检查是否有有效的认证信息
    const accessToken = Cookies.get('access_token')
    const refreshToken = Cookies.get('refresh_token')
    
    if (!accessToken && !refreshToken) {
        // 两个都没有，直接跳转登录页，不加载用户信息
        await router.replace('/login').catch(() => {})
        return
    }
    
    const userStore = useUserStore()
    await userStore.fetchUserInfo()
    const storedRoutes: DynamicRouteItem[] = Array.isArray(userStore.router) ? userStore.router : []
    mainRoute.children = [...baseChildren, ...buildRuntimeRouteTree(storedRoutes)]
    
    // Always add (replace) the route to ensure updates
    router.addRoute(mainRoute)
    
    if (!router.hasRoute('CatchAll404')) router.addRoute(createCatchAllRoute())

    const current = router.currentRoute.value
    const last = localStorage.getItem('lastVisitedPath')
    const restoreTarget = current
        ? resolveRouteRestoreTarget({
            currentPath: current.path,
            lastVisitedPath: last,
        })
        : null

    if (restoreTarget) {
        await router.replace(restoreTarget).catch(() => {})
        return
    }

    const target = resolveCurrentRouteTarget(router, current)
    if (target) {
        await router.replace(target).catch(() => {})
    }
}

export async function refreshCurrentRoute() {
    await setupDynamicRoutes()

    if (router.currentRoute.value.name !== 'login') {
        useMenuStore().refreshCurrentPage()
    }
}

export default router
