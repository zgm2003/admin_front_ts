import { defineStore } from 'pinia'

/** 是否在 Tauri 环境 */
export const isTauri = () => !!(window as any).__TAURI__

/** 是否应该使用原生通知（窗口不可见时） */
export async function shouldUseNative(): Promise<boolean> {
  if (!isTauri()) return false
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const win = getCurrentWindow()
    const [minimized, focused, visible] = await Promise.all([win.isMinimized(), win.isFocused(), win.isVisible()])
    return minimized || !focused || !visible
  } catch {
    return false
  }
}

/** 获取平台 */
const getPlatform = (): string => {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('mac') ? 'darwin-x86_64' : 'windows-x86_64'
}

export const useTauriStore = defineStore('tauri', {
  state: () => ({
    version: '',
    platform: '',
    forceUpdate: false,
  }),
  getters: {
    isTauriEnv: () => isTauri(),
  },
  actions: {
    async init() {
      if (!isTauri()) return
      
      const { getVersion } = await import('@tauri-apps/api/app')
      this.version = await getVersion()
      this.platform = getPlatform()
    },
    setForceUpdate(val: boolean) {
      this.forceUpdate = val
    },
  },
})
