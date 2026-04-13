import { defineStore } from 'pinia'
import {
  exitAppProcess,
  getTauriAppVersion,
  hideAppWindow,
  isTauri,
  listenWindowCloseRequested,
  resolveDesktopPlatform,
} from '@/platform/tauri'

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

      this.version = await getTauriAppVersion()
      this.platform = resolveDesktopPlatform()

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
      await hideAppWindow()
    },
    async exitApp() {
      await exitAppProcess(0)
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

      await listenWindowCloseRequested(async () => {
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
