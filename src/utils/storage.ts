import Cookies from 'js-cookie'

const DEVICE_KEY = 'device_id'

/**
 * 清除所有 Cookie（用于登出）
 */
export function clearAllCookies() {
  document.cookie.split(';').forEach((cookie) => {
    const cookieName = cookie.split('=')[0]?.trim()
    if (cookieName) Cookies.remove(cookieName)
  })
}

/**
 * 清空 localStorage，但保留指定 key
 */
export function clearLocalStorageExcept(keysToKeep: string[] = [DEVICE_KEY]) {
  const allKeys = Object.keys(localStorage)
  allKeys.forEach((key) => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key)
    }
  })
}
