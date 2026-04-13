import { isTauri, shouldUseNativeFromWindowState } from './env'
import { getCurrentAppWindowState } from './window'

export async function shouldUseNative() {
  if (!isTauri()) {
    return false
  }

  try {
    const state = await getCurrentAppWindowState()
    return shouldUseNativeFromWindowState(state)
  } catch {
    return false
  }
}

export async function sendNativeNotification(title: string, body: string) {
  if (!isTauri()) {
    return
  }

  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('send_notification', { title, body })
}
