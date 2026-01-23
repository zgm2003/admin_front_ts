import { defineStore } from 'pinia'

/** 是否在 Tauri 环境 */
export const isTauri = () => !!(window as any).__TAURI__

/** 获取平台（对应后端 UploadConfigEnum） */
const getPlatform = (): string => {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('mac')) return 'darwin-x86_64'
  return 'windows-x86_64'
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
