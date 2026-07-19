import { createWebNativeBridge } from '@/adapters/web/native-bridge'
import { AuthSessionError } from '@/modules/auth/types'
import {
  NativeCancelledError,
  NativeOperationError,
  NativePolicyError,
  NativeUnavailableError,
  NativeUpdaterError,
  type ManagedDownloadProgress,
  type ManagedDownloadStatus,
  type NativeAccessCredential,
  type NativeBridge,
  type NativeUnlisten,
  type NativeUpdate,
  type NativeWindowState,
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

const nativeOperationErrors = {
  native_policy: {
    message: '原生操作不符合安全策略',
    code: 'native.policy_rejected',
    policy: true,
  },
  native_operation: {
    message: '原生操作暂时不可用',
    code: 'native.operation_unavailable',
    policy: false,
  },
  notification_policy: {
    message: '通知内容不符合安全策略',
    code: 'native.notification_policy_rejected',
    policy: true,
  },
  notification_unavailable: {
    message: '系统通知暂时不可用',
    code: 'native.notification_unavailable',
    policy: false,
  },
} as const

function mapNativeOperationError(error: unknown): Error {
  if (exactObject(error)
    && Object.keys(error).length === 2
    && typeof error.kind === 'string'
    && typeof error.message === 'string'
    && Object.prototype.hasOwnProperty.call(nativeOperationErrors, error.kind)) {
    const definition = nativeOperationErrors[error.kind as keyof typeof nativeOperationErrors]
    if (error.message === definition.message) {
      return definition.policy
        ? new NativePolicyError(definition.message)
        : new NativeOperationError(definition.code, definition.message)
    }
  }
  return new NativeOperationError(
    'native.command_contract_invalid',
    'native command returned an invalid error contract',
  )
}

const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

function updaterContractError(): NativeUpdaterError {
  return new NativeUpdaterError(
    'native.updater_contract_invalid',
    '更新服务返回了无效数据',
  )
}

function updaterStateError(message = '更新操作顺序无效'): NativeUpdaterError {
  return new NativeUpdaterError('native.updater_state_invalid', message)
}

function updaterFailure(): NativeUpdaterError {
  return new NativeUpdaterError('native.updater_failed', '更新操作失败，请稍后重试')
}

function mapUpdaterError(error: unknown): NativeUpdaterError {
  return error instanceof NativeUpdaterError ? error : updaterFailure()
}

function parseUpdaterVersion(value: unknown): string {
  if (typeof value !== 'string' || value.length > 128 || !semverPattern.test(value)) {
    throw updaterContractError()
  }
  return value
}

function parseUpdaterBody(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string' || value.length > 65_536 || value.includes('\0')) {
    throw updaterContractError()
  }
  return value
}

function parseUpdaterDownloadEvent(value: unknown): UpdaterDownloadEvent {
  if (!exactObject(value) || typeof value.event !== 'string') {
    throw updaterContractError()
  }
  if (value.event === 'Finished') {
    if (Object.keys(value).length !== 1) throw updaterContractError()
    return { event: 'Finished' }
  }
  if (Object.keys(value).sort().join('|') !== 'data|event' || !exactObject(value.data)) {
    throw updaterContractError()
  }
  if (value.event === 'Started') {
    const keys = Object.keys(value.data)
    if (keys.length > 1 || (keys.length === 1 && keys[0] !== 'contentLength')) {
      throw updaterContractError()
    }
    const rawContentLength = value.data.contentLength
    if (rawContentLength === undefined || rawContentLength === null) {
      return { event: 'Started', data: {} }
    }
    if (typeof rawContentLength !== 'number'
      || !Number.isSafeInteger(rawContentLength)
      || rawContentLength <= 0) {
      throw updaterContractError()
    }
    return { event: 'Started', data: { contentLength: rawContentLength } }
  }
  if (value.event === 'Progress'
    && Object.keys(value.data).length === 1
    && typeof value.data.chunkLength === 'number'
    && Number.isSafeInteger(value.data.chunkLength)
    && value.data.chunkLength > 0) {
    return { event: 'Progress', data: { chunkLength: value.data.chunkLength } }
  }
  throw updaterContractError()
}

function createUpdaterEventSequence(listener: (event: UpdaterDownloadEvent) => void) {
  let phase: 'initial' | 'started' | 'finished' = 'initial'
  let contentLength: number | undefined
  let downloaded = 0
  let failure: NativeUpdaterError | null = null
  return {
    accept(rawEvent: unknown): void {
      if (failure) return
      try {
        const event = parseUpdaterDownloadEvent(rawEvent)
        if (event.event === 'Started') {
          if (phase !== 'initial') throw updaterContractError()
          phase = 'started'
          contentLength = event.data.contentLength
        } else if (event.event === 'Progress') {
          if (phase !== 'started') throw updaterContractError()
          downloaded += event.data.chunkLength
          if (!Number.isSafeInteger(downloaded)
            || (contentLength !== undefined && downloaded > contentLength)) {
            throw updaterContractError()
          }
        } else {
          if (phase !== 'started'
            || (contentLength !== undefined && downloaded !== contentLength)) {
            throw updaterContractError()
          }
          phase = 'finished'
        }
        listener(event)
      } catch (error) {
        failure = mapUpdaterError(error)
      }
    },
    assertFinished(): void {
      if (failure) throw failure
      if (phase !== 'finished') throw updaterContractError()
    },
  }
}

function parseNativeWindowState(value: unknown): NativeWindowState {
  if (!exactObject(value)
    || Object.keys(value).sort().join('|') !== 'focused|maximized|minimized|visible'
    || typeof value.minimized !== 'boolean'
    || typeof value.maximized !== 'boolean'
    || typeof value.focused !== 'boolean'
    || typeof value.visible !== 'boolean') {
    throw new NativeOperationError(
      'native.window_contract_invalid',
      'native window command returned an invalid contract',
    )
  }
  return {
    minimized: value.minimized,
    maximized: value.maximized,
    focused: value.focused,
    visible: value.visible,
  }
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
  const updaterResources = new Set<{ close(): Promise<void> }>()
  const safeNavigator = createWebNativeBridge().window

  async function currentWindowState(): Promise<NativeWindowState> {
    const { invoke } = await import('@tauri-apps/api/core')
    let state: unknown
    try {
      state = await invoke('get_window_state')
    } catch (error) {
      throw mapNativeOperationError(error)
    }
    return parseNativeWindowState(state)
  }

  async function releaseUpdaterResource(resource: { close(): Promise<void> }): Promise<void> {
    updaterResources.delete(resource)
    try {
      await resource.close()
    } catch {
      // Resource cleanup is best-effort and must never expose raw updater errors.
    }
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
        const { invoke } = await import('@tauri-apps/api/core')
        try {
          await invoke('minimize_window')
        } catch (error) {
          throw mapNativeOperationError(error)
        }
      },
      async toggleMaximize() {
        const { invoke } = await import('@tauri-apps/api/core')
        try {
          await invoke('toggle_maximize_window')
        } catch (error) {
          throw mapNativeOperationError(error)
        }
      },
      async hide() {
        const { invoke } = await import('@tauri-apps/api/core')
        try {
          await invoke('hide_window')
        } catch (error) {
          throw mapNativeOperationError(error)
        }
      },
      async requestClose() {
        const { invoke } = await import('@tauri-apps/api/core')
        try {
          await invoke('request_window_close')
        } catch (error) {
          throw mapNativeOperationError(error)
        }
      },
      listenResize(listener) {
        return listenTracked('tauri://resize', listener)
      },
      listenCloseRequested(listener) {
        return listenTracked('window-close-requested', listener)
      },
      listenExitRequested(listener) {
        return listenTracked('tray-exit-requested', listener)
      },
      openExternal(url) {
        safeNavigator.openExternal(url)
      },
      navigateExternal() {
        throw new NativeUnavailableError('window.navigateExternal')
      },
      openSameOrigin(path) {
        safeNavigator.openSameOrigin(path)
      },
    },
    updater: {
      async getCurrentVersion() {
        const { invoke } = await import('@tauri-apps/api/core')
        let version: unknown
        try {
          version = await invoke('get_app_version')
        } catch (error) {
          throw mapNativeOperationError(error)
        }
        return parseUpdaterVersion(version)
      },
      async check() {
        const { check } = await import('@tauri-apps/plugin-updater')
        let update: Awaited<ReturnType<typeof check>>
        try {
          update = await check()
        } catch (error) {
          throw mapUpdaterError(error)
        }
        if (!update) return null
        updaterResources.add(update)
        let version: string
        let body: string | undefined
        try {
          parseUpdaterVersion(update.currentVersion)
          version = parseUpdaterVersion(update.version)
          body = parseUpdaterBody(update.body)
        } catch (error) {
          await releaseUpdaterResource(update)
          throw mapUpdaterError(error)
        }
        let state: 'available' | 'downloading' | 'downloaded' | 'installing' | 'installed' | 'failed' = 'available'
        const wrapped: NativeUpdate = {
          version,
          async download(listener: (event: UpdaterDownloadEvent) => void) {
            if (state !== 'available') throw updaterStateError()
            state = 'downloading'
            const sequence = createUpdaterEventSequence(listener)
            try {
              await update.download(sequence.accept)
              sequence.assertFinished()
              state = 'downloaded'
            } catch (error) {
              state = 'failed'
              await releaseUpdaterResource(update)
              throw mapUpdaterError(error)
            }
          },
          async install() {
            if (state !== 'downloaded') {
              throw updaterStateError('update must be downloaded before installation')
            }
            state = 'installing'
            try {
              await update.install()
              state = 'installed'
            } catch (error) {
              state = 'failed'
              throw mapUpdaterError(error)
            } finally {
              await releaseUpdaterResource(update)
            }
          },
        }
        return body === undefined ? wrapped : { ...wrapped, body }
      },
    },
    notifications: {
      async shouldUseNative() {
        const state = await currentWindowState()
        return state.minimized || !state.focused || !state.visible
      },
      async send(title, body) {
        const { invoke } = await import('@tauri-apps/api/core')
        try {
          await invoke('send_notification', { title, body })
        } catch (error) {
          throw mapNativeOperationError(error)
        }
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
      async relaunchAfterUpdate() {
        const { invoke } = await import('@tauri-apps/api/core')
        try {
          await invoke('relaunch_app', { intent: 'update-installed' })
        } catch (error) {
          throw mapNativeOperationError(error)
        }
      },
      async exitAfterUserConfirmation() {
        const { invoke } = await import('@tauri-apps/api/core')
        try {
          await invoke('exit_app', { intent: 'user-confirmed-close' })
        } catch (error) {
          throw mapNativeOperationError(error)
        }
      },
    },
    async dispose() {
      for (const unlisten of [...listeners]) unlisten()
      listeners.clear()
      await Promise.all([...updaterResources].map(releaseUpdaterResource))
    },
  }
}
