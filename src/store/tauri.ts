import { defineStore } from 'pinia'
import type { Pinia } from 'pinia'
import {
  readDevicePreferences,
  writeDevicePreferences,
} from '@/modules/persistence/preferences'
import type { Persistence } from '@/modules/persistence/store'
import { getNativeBridge } from '@/adapters/native'

export type CloseAction = 'minimize' | 'exit'

export const useTauriStore = defineStore('tauri', {
  state: () => ({
    version: '',
    platform: '',
    forceUpdate: false,
    showCloseDialog: false,
    rememberChoice: false,
    _closeHandlerReady: false,
    closeAction: null as CloseAction | null,
  }),
  getters: {
    isTauriEnv: () => getNativeBridge().kind === 'tauri',
  },
  actions: {
    async init() {
      const native = getNativeBridge()
      if (native.kind !== 'tauri') return

      this.version = await native.updater.getCurrentVersion()
      this.platform = 'windows-x86_64'

      // 初始化窗口关闭事件监听
      await this.setupCloseHandler()
    },
    setForceUpdate(val: boolean) {
      this.forceUpdate = val
    },
    setCloseAction(action: CloseAction) {
      this.closeAction = action
    },
    clearCloseAction() {
      this.closeAction = null
    },
    async hideWindow() {
      await getNativeBridge().window.hide()
    },
    async exitApp() {
      await getNativeBridge().process.exitAfterUserConfirmation()
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
      const native = getNativeBridge()
      if (native.kind !== 'tauri' || this._closeHandlerReady) return
      this._closeHandlerReady = true

      await native.window.listenCloseRequested(async () => {
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

export function setupTauriStorePersistence(pinia: Pinia, persistence: Persistence): () => void {
  const store = useTauriStore(pinia)
  const restored = readDevicePreferences(persistence).desktopWindow?.closeAction
  if (restored) store.closeAction = restored
  return store.$subscribe((_mutation, state) => {
    const current = readDevicePreferences(persistence)
    const maximized = current.desktopWindow?.maximized
    if (state.closeAction) {
      writeDevicePreferences(persistence, {
        ...current,
        desktopWindow: maximized === undefined
          ? { closeAction: state.closeAction }
          : { maximized, closeAction: state.closeAction },
      })
      return
    }
    const withoutDesktopWindow = { ...current }
    delete withoutDesktopWindow.desktopWindow
    writeDevicePreferences(persistence, maximized === undefined
      ? withoutDesktopWindow
      : { ...withoutDesktopWindow, desktopWindow: { maximized } })
  }, {
    detached: true,
    flush: 'sync',
  })
}
