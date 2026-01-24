/**
 * 统一下载工具 - 自动适配浏览器和 Tauri 环境
 */
import { isTauri } from '@/store/tauri'

export { isTauri }

/**
 * 打开 URL（新窗口/系统浏览器）
 */
export const openUrl = async (url: string) => {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('plugin:opener|open_url', { url })
    } catch (e) {
      console.error('[download] Tauri openUrl error:', e)
      window.open(url, '_blank')
    }
  } else {
    window.open(url, '_blank')
  }
}

/**
 * 下载文件
 * @param url 文件 URL
 * @param filename 可选的文件名（仅 Web 环境生效）
 */
export const downloadFile = async (url: string, filename?: string) => {
  // Tauri 环境统一用 openUrl 打开系统浏览器
  if (isTauri()) {
    await openUrl(url)
    return
  }
  // Web 环境：有文件名用 a 标签下载，否则新窗口打开
  if (filename) {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } else {
    window.open(url, '_blank')
  }
}
