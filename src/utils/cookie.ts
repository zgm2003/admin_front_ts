import Cookies from 'js-cookie'

export function clearAllCookies() {
  document.cookie.split(';').forEach((cookie) => {
    const cookieName = cookie.split('=')[0].trim()
    Cookies.remove(cookieName)
  })
}

export function clearCookies() {
  const cookies = document.cookie.split(';')
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i]
    const eqPos = cookie.indexOf('=')
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
    if (name !== 'token') {
      Cookies.remove(name)
    }
  }
}
