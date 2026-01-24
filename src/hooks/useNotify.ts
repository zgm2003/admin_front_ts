import { ElNotification } from 'element-plus'
import { isTauri } from '@/store/tauri'

interface NotifyOptions {
  title: string
  body?: string
  type?: 'success' | 'warning' | 'info' | 'error'
  /** Web 端通知持续时间（ms），0 表示不自动关闭 */
  duration?: number
}

/** 是否应该使用原生通知 */
export async function shouldUseNative(): Promise<boolean> {
  if (!isTauri()) return false
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const win = getCurrentWindow()
    const minimized = await win.isMinimized()
    const focused = await win.isFocused()
    const visible = await win.isVisible()
    // 窗口最小化/失焦/隐藏时用系统通知
    return minimized || !focused || !visible
  } catch {
    return false
  }
}

/** 发送原生通知 */
async function sendNativeNotification(options: NotifyOptions) {
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('send_notification', {
      title: 'CloudAdmin',
      body: `${options.title}${options.body ? ': ' + options.body : ''}`,
    })
  } catch (e) {
    console.error('[useNotify] Native notification error:', e)
  }
}

/** 发送 Web 通知 */
function sendWebNotification(options: NotifyOptions) {
  ElNotification({
    title: options.title,
    message: options.body,
    type: options.type || 'info',
    duration: options.duration ?? 5000,
  })
}

/** 统一通知方法，自动判断使用原生通知还是 Web 通知 */
export async function notify(options: NotifyOptions) {
  const useNative = await shouldUseNative()
  if (useNative) {
    await sendNativeNotification(options)
  } else {
    sendWebNotification(options)
  }
}

/** 清除未读数 */
export async function clearUnread() {
  if (!isTauri()) return
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('clear_unread')
  } catch (e) {
    console.error('[useNotify] Clear unread error:', e)
  }
}

/** 监听托盘点击事件 */
export async function onTrayClick(callback: () => void) {
  if (!isTauri()) return
  try {
    const { listen } = await import('@tauri-apps/api/event')
    return listen('tray-clicked', callback)
  } catch (e) {
    console.error('[useNotify] Listen tray click error:', e)
  }
}

/** useNotify Hook */
export function useNotify() {
  return { notify, clearUnread, onTrayClick }
}
