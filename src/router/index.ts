import {createRouter, createWebHistory} from 'vue-router'
import Cookies from 'js-cookie'
import {useUserStore} from '@/store/user'
import {useMenuStore} from '@/store/menu'
import {ElNotification} from 'element-plus'
import { baseChildren, createCatchAllRoute, createMainRoute, publicRoutes } from '@/router/routes'
import type { DynamicRouteItem } from '@/types/user'
import {
    registerRouterGuards,
} from '@/router/guards'
import { resolveCurrentRouteTarget, resolveRouteRestoreTarget } from '@/router/guard-helpers'
import { resolveViewComponent, type ViewModuleMap } from '@/router/view-registry'

const mainRoute = createMainRoute()
const router = createRouter({history: createWebHistory(), routes: [...publicRoutes]})

export async function setupDynamicRoutes() {
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
    const componentPaths = import.meta.glob('../views/Main/**/*.vue') as ViewModuleMap

    // Reset children to base
    mainRoute.children = [...baseChildren]
    const mainChildren = mainRoute.children ?? []
    mainRoute.children = mainChildren

    if (storedRoutes.length > 0) {
        storedRoutes.forEach((route) => {
            const component = resolveViewComponent(componentPaths, route.view_key)
            if (component) {
                mainChildren.push({path: route.path, name: route.name, component, meta: {...(route.meta || {})}})
            } else {
                ElNotification.error({message: `View not found for route ${route.path}: ${route.view_key}`})
            }
        })
    }
    
    // Always add (replace) the route to ensure updates
    router.addRoute(mainRoute)
    
    if (!router.hasRoute('CatchAll404')) router.addRoute(createCatchAllRoute())

    const current = router.currentRoute.value
    const last = localStorage.getItem('lastVisitedPath')
    if (current && current.path === '/') {
        const restoreTarget = resolveRouteRestoreTarget({
            currentPath: current.path,
            lastVisitedPath: last,
        })
        await router.replace(restoreTarget || '/home').catch(() => {})
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

registerRouterGuards(router)

export default router
