import {createRouter, createWebHistory} from 'vue-router'
import HomeView from '@/views/Layout/index.vue'
import Cookies from 'js-cookie'
import {useUserStore} from '@/store/user'
import {useMenuStore} from '@/store/menu'
import {ElNotification} from 'element-plus'

const routes: any[] = [
    {path: '/login', name: 'login', component: () => import('@/views/Login/index.vue')},
    {path: '/editPassword', name: 'editPassword', component: () => import('@/views/EditPassword/index.vue')},
    // {path: '/personal', name: 'personal', component: () => import('@/views/Main/personal/index.vue')},
    {path: '/404', name: '404', component: () => import('@/views/Error/404.vue')},
]

const baseChildren = [
    {path: '/home', name: 'home', component: () => import('@/views/Main/home/index.vue'), meta: {menuId: '0'}}
]

const mainRoute: any = {
    path: '/', name: 'HomeView', component: HomeView, redirect: '/home', children: [...baseChildren]
}

const router = createRouter({history: createWebHistory(), routes})

export async function setupDynamicRoutes() {
    const userStore = useUserStore()
    await userStore.fetchUserInfo()
    const storedRoutes = Array.isArray(userStore.router) ? userStore.router : []
    const componentPaths = import.meta.glob('./views/Main/**/*.vue')

    const resolveComponent = (cp: string) => {
        if (!cp || typeof cp !== 'string') return undefined
        const c = cp.replace(/^\/+/, '')
        const key = `./views/Main/${c}/index.vue`
        return componentPaths[key]
    }

    // Reset children to base
    mainRoute.children = [...baseChildren]

    if (storedRoutes.length > 0) {
        storedRoutes.forEach((route: any) => {
            const component = resolveComponent(route.component)
            if (component) {
                mainRoute.children.push({path: route.path, name: route.name, component, meta: {...(route.meta || {})}})
            } else {
                ElNotification.error({message: `Component not found for route ${route.path}: ${route.component}`})
            }
        })
    }
    
    // Always add (replace) the route to ensure updates
    router.addRoute(mainRoute)
    
    if (!router.hasRoute('CatchAll404')) router.addRoute({ path: '/:pathMatch(.*)*', name: 'CatchAll404', redirect: '/404' })

    const current = router.currentRoute.value
    const last = Cookies.get('lastVisitedPath')
    const target = current?.fullPath || current?.path || ''
    if (current && current.path === '/') {
        await router.replace(last && last !== '/login' ? last : '/home').catch(() => {})
        return
    }
    if (target) {
        const resolved = router.resolve(target)
        if (resolved && resolved.matched && resolved.matched.length > 0) {
            await router.replace(target).catch(() => {})
        } else {
            await router.replace('/404').catch(() => {})
        }
    }
}

router.beforeEach((to, _from, next) => {
    if (to.name !== 'login') Cookies.set('lastVisitedPath', to.fullPath)
    next()
})
router.afterEach((to) => {
    const menuStore = useMenuStore();
    const userStore = useUserStore();
    const menuId = (to.meta.menuId as string) || '';
    
    menuStore.selectedMenu = menuId;
    Cookies.set('selectedMenu', menuId)

    if (menuId) {
        // Use the flat permissionMap for O(1) lookup
        const item = userStore.permissionMap.get(menuId);
        if (item) {
            menuStore.selectMenu(item)
        }
    }
})

export default router
