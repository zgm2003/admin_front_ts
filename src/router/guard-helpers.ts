import type { RouteLocationNormalizedLoaded, RouteRecordName, Router } from 'vue-router'

export function isPublicRouteName(routeName: RouteRecordName | null | undefined) {
  return routeName === 'login' || routeName === '404'
}

export function shouldRedirectToLogin(params: {
  routeName: RouteRecordName | null | undefined
  accessToken?: string
  refreshToken?: string
}) {
  const { routeName, accessToken, refreshToken } = params
  if (isPublicRouteName(routeName)) {
    return false
  }

  return !accessToken && !refreshToken
}

export function resolveRouteRestoreTarget(params: {
  currentPath: string
  lastVisitedPath?: string | null
}) {
  const { currentPath, lastVisitedPath } = params
  if (currentPath !== '/') {
    return null
  }

  if (lastVisitedPath && lastVisitedPath !== '/login') {
    return lastVisitedPath
  }

  return '/home'
}

export function resolveCurrentRouteTarget(router: Router, currentRoute: RouteLocationNormalizedLoaded) {
  const target = currentRoute?.fullPath || currentRoute?.path || ''
  if (!target) {
    return '/404'
  }

  const resolved = router.resolve(target)
  if (resolved.matched.length > 0) {
    return target
  }

  return '/404'
}
