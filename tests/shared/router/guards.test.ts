import { describe, expect, it } from 'vitest'

const {
  isPublicRouteName,
  shouldRedirectToLogin,
  resolveRouteRestoreTarget,
} = await import('../../../src/router/guard-helpers')

describe('router guards', () => {
  it('treats login and 404 as public routes', () => {
    expect(isPublicRouteName('login')).toBe(true)
    expect(isPublicRouteName('404')).toBe(true)
    expect(isPublicRouteName('home')).toBe(false)
  })

  it('redirects to login only when both tokens are missing on protected routes', () => {
    expect(shouldRedirectToLogin({ routeName: 'home', accessToken: '', refreshToken: '' })).toBe(true)
    expect(shouldRedirectToLogin({ routeName: 'home', accessToken: 'a', refreshToken: '' })).toBe(false)
    expect(shouldRedirectToLogin({ routeName: 'home', accessToken: '', refreshToken: 'r' })).toBe(false)
    expect(shouldRedirectToLogin({ routeName: 'login', accessToken: '', refreshToken: '' })).toBe(false)
  })

  it('restores the last visited path when the current route is root or login', () => {
    expect(resolveRouteRestoreTarget({ currentPath: '/', lastVisitedPath: '/pay/channel' })).toBe('/pay/channel')
    expect(resolveRouteRestoreTarget({ currentPath: '/', lastVisitedPath: '/login' })).toBe('/home')
    expect(resolveRouteRestoreTarget({ currentPath: '/', lastVisitedPath: '' })).toBe('/home')
    expect(resolveRouteRestoreTarget({ currentPath: '/login', lastVisitedPath: '/user/userManager' })).toBe('/user/userManager')
    expect(resolveRouteRestoreTarget({ currentPath: '/login', lastVisitedPath: '' })).toBe('/home')
    expect(resolveRouteRestoreTarget({ currentPath: '/pay/channel', lastVisitedPath: '/home' })).toBeNull()
  })
})
