import { createWebNativeBridge } from '@/adapters/web/native-bridge'
import { AuthSessionError } from '@/modules/auth/types'
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
  readonly status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled'
  readonly downloaded: number
  readonly total: number
  readonly speed: number
  readonly progress: number
  readonly filename: string
  readonly error?: string
}

interface RawAccessCredential {
  readonly accessToken: string
  readonly expiresAt: number
}

const nativeCredentialErrors = {
  credential_store: {
    message: '系统安全凭证存储不可用',
    code: 'auth.credential_store_unavailable',
  },
  credential_missing: {
    message: '登录凭证不存在，请重新登录',
    code: 'auth.credential_missing',
    status: 401,
  },
  policy: {
    message: '请求目标不符合安全策略',
    code: 'auth.native_policy_rejected',
  },
  timeout: {
    message: '认证服务请求超时',
    code: 'auth.native_timeout',
    retryable: true,
  },
  network: {
    message: '无法连接认证服务',
    code: 'auth.native_network',
    retryable: true,
  },
  response_contract: {
    message: '认证服务响应不符合正式契约',
    code: 'auth.response_invalid',
  },
  authentication: {
    message: '登录凭证已失效，请重新登录',
    code: 'auth.revoked',
    status: 401,
  },
  server: {
    message: '认证服务暂时不可用',
    code: 'auth.server_unavailable',
    retryable: true,
  },
} as const

function exactObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const nativeDownloadErrors = {
  download_cancelled: '已取消下载',
  download_policy: '下载请求不符合安全策略',
  download_timeout: '下载请求超时',
  download_network: '无法连接下载服务',
  download_response: '下载服务响应不符合安全要求',
  download_filesystem: '无法安全保存下载文件',
  download_task_missing: '下载任务不存在',
  download_task_state: '下载任务状态不允许此操作',
} as const

function mapNativeDownloadError(error: unknown): Error {
  if (exactObject(error)
    && Object.keys(error).length === 2
    && typeof error.kind === 'string'
    && typeof error.message === 'string'
    && Object.prototype.hasOwnProperty.call(nativeDownloadErrors, error.kind)) {
    const message = nativeDownloadErrors[error.kind as keyof typeof nativeDownloadErrors]
    if (error.message === message) {
      if (error.kind === 'download_cancelled') return new NativeCancelledError(message)
      if (error.kind === 'download_policy') return new NativePolicyError(message)
      const mapped = new Error(message)
      mapped.name = 'NativeDownloadError'
      return mapped
    }
  }
  const mapped = new Error('native download command returned an invalid error contract')
  mapped.name = 'NativeDownloadContractError'
  return mapped
}

export function mapNativeCredentialError(error: unknown): AuthSessionError {
  if (exactObject(error)
    && Object.keys(error).length === 2
    && typeof error.kind === 'string'
    && typeof error.message === 'string'
    && Object.prototype.hasOwnProperty.call(nativeCredentialErrors, error.kind)) {
    const definition = nativeCredentialErrors[error.kind as keyof typeof nativeCredentialErrors]
    if (error.message === definition.message) {
      return new AuthSessionError(definition.code, definition.message, {
        retryable: 'retryable' in definition && definition.retryable === true,
        ...('status' in definition ? { status: definition.status } : {}),
      })
    }
  }
  return new AuthSessionError(
    'auth.native_command_contract_invalid',
    'native credential command returned an invalid error contract',
  )
}

function parseNativeAccessCredential(value: unknown): NativeAccessCredential {
  if (!exactObject(value)
    || Object.keys(value).length !== 2
    || typeof value.accessToken !== 'string'
    || value.accessToken.length === 0
    || typeof value.expiresAt !== 'number'
    || !Number.isFinite(value.expiresAt)
    || value.expiresAt <= 0) {
    throw new AuthSessionError(
      'auth.native_command_contract_invalid',
      'native credential command returned an invalid success contract',
    )
  }
  return { accessToken: value.accessToken, expiresAt: value.expiresAt }
}

const managedDownloadStatuses = new Set<ManagedDownloadStatus>([
  'pending',
  'downloading',
  'completed',
  'failed',
  'cancelled',
])
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function validTaskId(value: unknown): value is string {
  return typeof value === 'string' && uuidPattern.test(value)
}

function assertTaskId(value: string): void {
  if (!validTaskId(value)) {
    throw new NativePolicyError('managed download task id is invalid')
  }
}

function toManagedProgress(value: unknown): ManagedDownloadProgress {
  if (!exactObject(value)) {
    throw new Error('native download progress violates the managed contract')
  }
  const keys = Object.keys(value)
  const expectedKeys = value.error === undefined
    ? ['downloaded', 'filename', 'id', 'progress', 'speed', 'status', 'total']
    : ['downloaded', 'error', 'filename', 'id', 'progress', 'speed', 'status', 'total']
  if (keys.sort().join('|') !== expectedKeys.join('|')
    || !validTaskId(value.id)
    || typeof value.status !== 'string'
    || !managedDownloadStatuses.has(value.status as ManagedDownloadStatus)
    || typeof value.downloaded !== 'number'
    || !Number.isSafeInteger(value.downloaded)
    || value.downloaded < 0
    || typeof value.total !== 'number'
    || !Number.isSafeInteger(value.total)
    || value.total < 0
    || value.downloaded > value.total
    || typeof value.speed !== 'number'
    || !Number.isSafeInteger(value.speed)
    || value.speed < 0
    || typeof value.progress !== 'number'
    || !Number.isFinite(value.progress)
    || value.progress < 0
    || value.progress > 100
    || typeof value.filename !== 'string'
    || value.filename.length === 0
    || (value.error !== undefined && typeof value.error !== 'string')) {
    throw new Error('native download progress violates the managed contract')
  }
  const terminalError = value.status === 'failed' || value.status === 'cancelled'
  if ((terminalError && typeof value.error !== 'string')
    || (!terminalError && value.error !== undefined)
    || (value.status === 'completed'
      && (value.downloaded !== value.total || value.progress !== 100))) {
    throw new Error('native download progress violates the managed contract')
  }
  const progress = value as unknown as RawDownloadProgress
  const mapped = {
    id: progress.id,
    status: progress.status,
    downloaded: progress.downloaded,
    total: progress.total,
    speed: progress.speed,
    progress: progress.progress,
    filename: progress.filename,
  } satisfies Omit<ManagedDownloadProgress, 'error'>
  return progress.error === undefined ? mapped : { ...mapped, error: progress.error }
}

export async function isTauriRuntime(): Promise<boolean> {
  const { isTauri } = await import('@tauri-apps/api/core')
  return isTauri()
}

export function createTauriNativeBridge(): NativeBridge {
  const listeners = new Set<NativeUnlisten>()
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
        try {
          await invoke('seal_refresh_credential', { input: credential.refreshToken })
        } catch (error) {
          throw mapNativeCredentialError(error)
        }
      },
      async refresh(deviceId): Promise<NativeAccessCredential> {
        const { invoke } = await import('@tauri-apps/api/core')
        let credential: RawAccessCredential
        try {
          credential = await invoke<RawAccessCredential>('refresh_access_credential', { deviceId })
        } catch (error) {
          throw mapNativeCredentialError(error)
        }
        return parseNativeAccessCredential(credential)
      },
      async clear() {
        const { invoke } = await import('@tauri-apps/api/core')
        try {
          await invoke('clear_refresh_credential')
        } catch (error) {
          throw mapNativeCredentialError(error)
        }
      },
    },
    downloads: {
      async start(input) {
        const { invoke } = await import('@tauri-apps/api/core')
        let id: unknown
        try {
          id = await invoke('start_managed_download', input)
        } catch (error) {
          throw mapNativeDownloadError(error)
        }
        if (!validTaskId(id)) {
          throw new Error('native download command returned an invalid task id')
        }
        return id
      },
      async cancel(taskId) {
        assertTaskId(taskId)
        const { invoke } = await import('@tauri-apps/api/core')
        try {
          await invoke('cancel_managed_download', { taskId })
        } catch (error) {
          throw mapNativeDownloadError(error)
        }
      },
      async getProgress(taskId) {
        assertTaskId(taskId)
        const { invoke } = await import('@tauri-apps/api/core')
        let progress: unknown
        try {
          progress = await invoke('get_managed_download_progress', { taskId })
        } catch (error) {
          throw mapNativeDownloadError(error)
        }
        if (progress === null) return null
        return toManagedProgress(progress)
      },
      async getAll() {
        const { invoke } = await import('@tauri-apps/api/core')
        let downloads: unknown
        try {
          downloads = await invoke('get_all_managed_downloads')
        } catch (error) {
          throw mapNativeDownloadError(error)
        }
        if (!Array.isArray(downloads)) {
          throw new Error('native download list violates the managed contract')
        }
        return downloads.map(toManagedProgress)
      },
      async remove(taskId) {
        assertTaskId(taskId)
        const { invoke } = await import('@tauri-apps/api/core')
        try {
          await invoke('remove_managed_download', { taskId })
        } catch (error) {
          throw mapNativeDownloadError(error)
        }
      },
      async reveal(taskId) {
        assertTaskId(taskId)
        const { invoke } = await import('@tauri-apps/api/core')
        try {
          await invoke('reveal_managed_download', { taskId })
        } catch (error) {
          throw mapNativeDownloadError(error)
        }
      },
      listenProgress(listener) {
        return listenTracked<RawDownloadProgress>('download-progress', (progress) => {
          listener(toManagedProgress(progress))
        })
      },
      listenCompleted(listener) {
        return listenTracked<unknown>('download-completed', (taskId) => {
          if (!validTaskId(taskId)) {
            throw new Error('native download completion event violates the managed contract')
          }
          listener(taskId)
        })
      },
      listenFailed(listener) {
        return listenTracked<unknown>('download-failed', (failure) => {
          if (!Array.isArray(failure)
            || failure.length !== 2
            || !validTaskId(failure[0])
            || typeof failure[1] !== 'string'
            || !Object.values(nativeDownloadErrors).includes(
              failure[1] as typeof nativeDownloadErrors[keyof typeof nativeDownloadErrors],
            )) {
            throw new Error('native download failure event violates the managed contract')
          }
          const [taskId, message] = failure
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
    },
  }
}
