import type { RouteRecordRaw } from 'vue-router'

export const publicRoutes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('@/views/Login/index.vue') },
]

export const baseChildren: RouteRecordRaw[] = [
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/Main/home/index.vue'),
    meta: { menuId: '0', pageLayout: 'plain' },
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/Error/404.vue'),
    meta: { pageLayout: 'centered', errorKind: 'not-found' },
  },
]

export function createMainRoute(children: RouteRecordRaw[] = [...baseChildren]): RouteRecordRaw {
  return {
    path: '/',
    name: 'HomeView',
    component: () => import('@/views/Layout/index.vue'),
    redirect: '/home',
    children,
  }
}

export function createCatchAllRoute(): RouteRecordRaw {
  return {
    path: '/:pathMatch(.*)*',
    name: 'CatchAll404',
    redirect: '/404',
  }
}
