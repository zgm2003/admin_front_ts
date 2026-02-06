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

const CLOSE_ACTION_KEY = 'tauri_close_action'
export type CloseAction = 'minimize' | 'exit'

export const useTauriStore = defineStore('tauri', {
  state: () => ({
    version: '',
    platform: '',
    forceUpdate: false,
    showCloseDialog: false,
    rememberChoice: false,
    _closeHandlerReady: false,
  }),
  getters: {
    isTauriEnv: () => isTauri(),
    closeAction(): CloseAction | null {
      const val = localStorage.getItem(CLOSE_ACTION_KEY)
      if (val === 'minimize' || val === 'exit') return val
      return null
    },
  },
  actions: {
    async init() {
      if (!isTauri()) return

      const { getVersion } = await import('@tauri-apps/api/app')
      this.version = await getVersion()
      this.platform = getPlatform()

      // 初始化窗口关闭事件监听
      await this.setupCloseHandler()
    },
    setForceUpdate(val: boolean) {
      this.forceUpdate = val
    },
    setCloseAction(action: CloseAction) {
      localStorage.setItem(CLOSE_ACTION_KEY, action)
    },
    clearCloseAction() {
      localStorage.removeItem(CLOSE_ACTION_KEY)
    },
    async hideWindow() {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().hide()
    },
    async exitApp() {
      const { exit } = await import('@tauri-apps/plugin-process')
      await exit(0)
    },
    async handleMinimize() {
      this.showCloseDialog = false
      if (this.rememberChoice) this.setCloseAction('minimize')
      await this.hideWindow()
    },
    async handleExit() {
      this.showCloseDialog = false
      if (this.rememberChoice) this.setCloseAction('exit')
      await this.exitApp()
    },
    async setupCloseHandler() {
      if (!isTauri() || this._closeHandlerReady) return
      this._closeHandlerReady = true

      const { listen } = await import('@tauri-apps/api/event')

      await listen('window-close-requested', async () => {
        const saved = this.closeAction

        if (saved === 'minimize') {
          await this.hideWindow()
          return
        }

        if (saved === 'exit') {
          await this.exitApp()
          return
        }

        this.rememberChoice = false
        this.showCloseDialog = true
      })
    },
  },
})
