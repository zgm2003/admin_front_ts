import { createWebNativeBridge } from '@/adapters/web/native-bridge'
import {
  NativeCancelledError,
  NativePolicyError,
  type ManagedDownloadProgress,
  type ManagedDownloadStatus,
  type NativeAccessCredential,
  type NativeBridge,
  type NativeUnlisten,
  type NativeUpdate,
  type UpdaterDownloadEvent,
} from '@/modules/native/types'

interface RawDownloadProgress {
  readonly id: string
  readonly status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled'
  readonly downloaded: number
  readonly total: number
  readonly speed: number
  readonly progress: number
  readonly filename: string
  readonly save_path: string
  readonly error?: string
}

interface RawAccessCredential {
  readonly accessToken: string
  readonly expiresAt: number
}

function managedStatus(status: RawDownloadProgress['status']): ManagedDownloadStatus {
  return status
}

function toManagedProgress(progress: RawDownloadProgress): ManagedDownloadProgress {
  const mapped = {
    id: progress.id,
    status: managedStatus(progress.status),
    downloaded: progress.downloaded,
    total: progress.total,
    speed: progress.speed,
    progress: progress.progress,
    filename: progress.filename,
  } satisfies Omit<ManagedDownloadProgress, 'error'>
  return progress.error === undefined ? mapped : { ...mapped, error: progress.error }
}

function selectedFilename(path: string, fallback: string): string {
  const filename = path.split(/[/\\]/).pop()?.trim()
  return filename || fallback
}

export async function isTauriRuntime(): Promise<boolean> {
  const { isTauri } = await import('@tauri-apps/api/core')
  return isTauri()
}

export function createTauriNativeBridge(): NativeBridge {
  const listeners = new Set<NativeUnlisten>()
  const savePaths = new Map<string, string>()
  const safeNavigator = createWebNativeBridge().window

  async function currentWindowState() {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const currentWindow = getCurrentWindow()
    const [minimized, maximized, focused, visible] = await Promise.all([
      currentWindow.isMinimized(),
      currentWindow.isMaximized(),
      currentWindow.isFocused(),
      currentWindow.isVisible(),
    ])
    return { minimized, maximized, focused, visible }
  }

  async function listenTracked<T>(eventName: string, listener: (payload: T) => void): Promise<NativeUnlisten> {
    const { listen } = await import('@tauri-apps/api/event')
    const nativeUnlisten = await listen<T>(eventName, (event) => listener(event.payload))
    let active = true
    const unlisten = () => {
      if (!active) return
      active = false
      listeners.delete(unlisten)
      nativeUnlisten()
    }
    listeners.add(unlisten)
    return unlisten
  }

  return {
    kind: 'tauri',
    window: {
      getState: currentWindowState,
      async minimize() {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        await getCurrentWindow().minimize()
      },
      async toggleMaximize() {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        await getCurrentWindow().toggleMaximize()
      },
      async hide() {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        await getCurrentWindow().hide()
      },
      async requestClose() {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        await getCurrentWindow().close()
      },
      listenResize(listener) {
        return listenTracked('tauri://resize', listener)
      },
      listenCloseRequested(listener) {
        return listenTracked('window-close-requested', listener)
      },
      openExternal(url) {
        safeNavigator.openExternal(url)
      },
      openSameOrigin(path) {
        safeNavigator.openSameOrigin(path)
      },
    },
    updater: {
      async getCurrentVersion() {
        const { getVersion } = await import('@tauri-apps/api/app')
        return getVersion()
      },
      async check() {
        const { check } = await import('@tauri-apps/plugin-updater')
        const update = await check()
        if (!update) return null
        const wrapped: NativeUpdate = {
          version: update.version,
          async download(listener: (event: UpdaterDownloadEvent) => void) {
            await update.download((event) => listener(event as UpdaterDownloadEvent))
          },
          async install() {
            await update.install()
          },
        }
        return typeof update.body === 'string' ? { ...wrapped, body: update.body } : wrapped
      },
    },
    notifications: {
      async shouldUseNative() {
        const state = await currentWindowState()
        return state.minimized || !state.focused || !state.visible
      },
      async send(title, body) {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('send_notification', { title, body })
      },
    },
    credentials: {
      async seal(credential) {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('seal_refresh_credential', { input: credential })
      },
      async refresh(): Promise<NativeAccessCredential> {
        const { invoke } = await import('@tauri-apps/api/core')
        const credential = await invoke<RawAccessCredential>('refresh_access_credential')
        return credential
      },
      async clear() {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('clear_refresh_credential')
      },
    },
    downloads: {
      async start(input) {
        const { save } = await import('@tauri-apps/plugin-dialog')
        const savePath = await save({ defaultPath: input.suggestedFilename })
        if (!savePath) throw new NativeCancelledError('managed download was cancelled')
        const id = crypto.randomUUID()
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('start_download', {
          id,
          url: input.url,
          savePath,
          filename: selectedFilename(savePath, input.suggestedFilename),
        })
        savePaths.set(id, savePath)
        return id
      },
      async cancel(taskId) {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('cancel_download', { id: taskId })
      },
      async getProgress(taskId) {
        const { invoke } = await import('@tauri-apps/api/core')
        const progress = await invoke<RawDownloadProgress | null>('get_download_progress', { id: taskId })
        if (!progress) return null
        savePaths.set(progress.id, progress.save_path)
        return toManagedProgress(progress)
      },
      async getAll() {
        const { invoke } = await import('@tauri-apps/api/core')
        const downloads = await invoke<RawDownloadProgress[]>('get_all_downloads')
        return downloads.map((progress) => {
          savePaths.set(progress.id, progress.save_path)
          return toManagedProgress(progress)
        })
      },
      async remove(taskId) {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('remove_download', { id: taskId })
        savePaths.delete(taskId)
      },
      async reveal(taskId) {
        const path = savePaths.get(taskId)
        if (!path) throw new NativePolicyError('managed download is not completed or recorded')
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('open_file_folder', { path })
      },
      listenProgress(listener) {
        return listenTracked<RawDownloadProgress>('download-progress', (progress) => {
          savePaths.set(progress.id, progress.save_path)
          listener(toManagedProgress(progress))
        })
      },
      listenCompleted(listener) {
        return listenTracked<string>('download-completed', listener)
      },
      listenFailed(listener) {
        return listenTracked<[string, string]>('download-failed', ([taskId, message]) => {
          listener({ taskId, message })
        })
      },
    },
    process: {
      async relaunch() {
        const { relaunch } = await import('@tauri-apps/plugin-process')
        await relaunch()
      },
      async exit(code) {
        const { exit } = await import('@tauri-apps/plugin-process')
        await exit(code)
      },
    },
    async dispose() {
      for (const unlisten of [...listeners]) unlisten()
      listeners.clear()
      savePaths.clear()
    },
  }
}
