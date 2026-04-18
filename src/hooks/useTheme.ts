export function toggleDarkMode(isDark: boolean) {
  const html = document.documentElement
  if (isDark) {
    html.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    html.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}
