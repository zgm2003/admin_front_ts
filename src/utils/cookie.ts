import Cookies from 'js-cookie'

/**
 * 清除所有 Cookie（用于登出）
 */
export function clearAllCookies() {
  document.cookie.split(';').forEach((cookie) => {
    const cookieName = cookie.split('=')[0]?.trim()
    if (cookieName) Cookies.remove(cookieName)
  })
}
