/**
 * 统一下载工具 - 自动适配浏览器和 Tauri 环境
 */
import { isTauri, useTauri } from '@/hooks/useTauri'

export { isTauri }

/**
 * 打开 URL
 * - 浏览器：新窗口打开
 * - Tauri：调用系统默认浏览器打开
 */
export const openUrl = async (url: string) => {
  const tauri = useTauri()
  if (tauri?.opener?.openUrl) {
    try {
      await tauri.opener.openUrl(url)
    } catch {
      window.open(url, '_blank')
    }
  } else {
    window.open(url, '_blank')
  }
}

/**
 * 下载文件
 * @param url 文件 URL
 * @param filename 可选的文件名
 */
export const downloadFile = async (url: string, filename?: string) => {
  if (isTauri()) {
    await openUrl(url)
  } else if (filename) {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } else {
    window.open(url, '_blank')
  }
}
