import { isTauri, type TauriWindowState } from './env'

export async function getCurrentAppWindow() {
  if (!isTauri()) {
    return null
  }

  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  return getCurrentWindow()
}

export async function getCurrentAppWindowState(): Promise<TauriWindowState> {
  const currentWindow = await getCurrentAppWindow()
  if (!currentWindow) {
    return {
      minimized: false,
      focused: true,
      visible: true,
    }
  }

  const [minimized, focused, visible] = await Promise.all([
    currentWindow.isMinimized(),
    currentWindow.isFocused(),
    currentWindow.isVisible(),
  ])

  return {
    minimized,
    focused,
    visible,
  }
}

export async function isCurrentAppWindowMaximized() {
  const currentWindow = await getCurrentAppWindow()
  return currentWindow ? currentWindow.isMaximized() : false
}

export async function minimizeAppWindow() {
  const currentWindow = await getCurrentAppWindow()
  if (currentWindow) {
    await currentWindow.minimize()
  }
}

export async function closeAppWindow() {
  const currentWindow = await getCurrentAppWindow()
  if (currentWindow) {
    await currentWindow.close()
  }
}

export async function toggleMaximizeAppWindow() {
  const currentWindow = await getCurrentAppWindow()
  if (currentWindow) {
    await currentWindow.toggleMaximize()
  }
}

export async function hideAppWindow() {
  const currentWindow = await getCurrentAppWindow()
  if (currentWindow) {
    await currentWindow.hide()
  }
}

export async function listenWindowResize(handler: () => void) {
  if (!isTauri()) {
    return () => {}
  }

  const { listen } = await import('@tauri-apps/api/event')
  return await listen('tauri://resize', handler) as unknown as () => void
}

export async function listenWindowCloseRequested(handler: () => void) {
  if (!isTauri()) {
    return () => {}
  }

  const { listen } = await import('@tauri-apps/api/event')
  return await listen('window-close-requested', handler) as unknown as () => void
}
