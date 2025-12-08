import {createRouter, createWebHistory} from 'vue-router'
import HomeView from '@/views/Layout/index.vue'
import Cookies from 'js-cookie'
import {useUserStore} from '@/store/user'
import {useMenuStore} from '@/store/menu'
import {ElNotification} from 'element-plus'
import {clearCookies} from '@/utils/cookie'

const routes: any[] = [
    {path: '/login', name: 'login', component: () => import('@/views/Login/index.vue')},
    {path: '/editPassword', name: 'editPassword', component: () => import('@/views/EditPassword/index.vue')},
    {path: '/personal', name: 'personal', component: () => import('@/views/Personal/index.vue')},
    {path: '/404', name: '404', component: () => import('@/views/Error/404.vue')},
    {
        path: '/:pathMatch(.*)*', name: 'NotFound', beforeEnter: (_to: any, _from: any, next: any) => {
            next(false)
        }
    },
]

const mainRoute: any = {
    path: '/', name: 'HomeView', component: HomeView, redirect: '/home', children: [
        {path: '/home', name: 'home', component: () => import('@/views/Main/home/index.vue'), meta: {menuId: '0'}}
    ]
}

const router = createRouter({history: createWebHistory(), routes})

export async function setupDynamicRoutes() {
    const userStore = useUserStore()
    await userStore.fetchUserInfo()
    const storedRoutes = Array.isArray(userStore.router) ? userStore.router : []
    const componentPaths = import.meta.glob('./views/Main/**/*.vue')

    const normalizeComponentPath = (cp: string) => {
        if (!cp || typeof cp !== 'string') return ''
        const noQuery = cp.split('?')[0]
        let s = noQuery.replace(/\\/g, '/')
        s = s.replace(/(^\.|^\/)*/, '')
        s = s.replace(/^views\/Main\//i, '')
        s = s.replace(/^Main\//i, '')
        s = s.replace(/\/index\.vue$/i, '')
        s = s.replace(/\.vue$/i, '')
        return s
    }
    const resolveComponent = (cp: string) => {
        const c = normalizeComponentPath(cp)
        const candidates = [`./views/Main/${c}/index.vue`, `./views/Main/${c}.vue`]
        for (const k of candidates) if (componentPaths[k]) return componentPaths[k]
        return undefined
    }

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
    if (!router.hasRoute('HomeView')) router.addRoute(mainRoute)
    const current = router.currentRoute.value
    const last = Cookies.get('lastVisitedPath')
    if (!current || !current.matched || current.matched.length === 0 || current.path === '/') {
        await router.replace(last && last !== '/login' ? last : '/home').catch(() => {
        })
    }
}

router.beforeEach((to, _from, next) => {
    if (to.name !== 'login' && to.name !== 'NotFound') Cookies.set('lastVisitedPath', to.fullPath)
    next()
})
router.afterEach((to) => {
    const menuStore = useMenuStore();
    menuStore.selectedMenu = to.meta.menuId;
    Cookies.set('selectedMenu', to.meta.menuId as any)
})

// Clear cookies on page unload similar to JS project
window.addEventListener('beforeunload', () => {
    clearCookies()
})

export default router
