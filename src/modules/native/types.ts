export type NativeUnlisten = () => void

export interface WindowBridge {
  openExternal(url: string): void
  navigateExternal(url: string): void
  openSameOrigin(path: string): void
}

export interface NotificationBridge {
  shouldUseNative(): Promise<boolean>
  send(title: string, body: string): Promise<void>
}

export type ManagedDownloadStatus =
  | 'pending'
  | 'downloading'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface ManagedDownloadProgress {
  readonly id: string
  readonly status: ManagedDownloadStatus
  readonly downloaded: number
  readonly total: number
  readonly speed: number
  readonly progress: number
  readonly filename: string
  readonly error?: string
}

export interface ManagedDownloadBridge {
  start(input: { readonly url: string; readonly suggestedFilename: string }): Promise<string>
  cancel(taskId: string): Promise<void>
  getProgress(taskId: string): Promise<ManagedDownloadProgress | null>
  getAll(): Promise<ManagedDownloadProgress[]>
  remove(taskId: string): Promise<void>
  reveal(taskId: string): Promise<void>
  listenProgress(listener: (progress: ManagedDownloadProgress) => void): Promise<NativeUnlisten>
  listenCompleted(listener: (taskId: string) => void): Promise<NativeUnlisten>
  listenFailed(listener: (failure: { readonly taskId: string; readonly message: string }) => void): Promise<NativeUnlisten>
}

export interface NativeBridge {
  readonly kind: 'web' | 'tauri'
  readonly window: WindowBridge
  readonly notifications: NotificationBridge
  readonly downloads: ManagedDownloadBridge
  dispose(): Promise<void>
}

export class NativeUnavailableError extends Error {
  readonly code = 'native.unavailable'

  constructor(operation: string) {
    super(`${operation} is unavailable in the web runtime`)
    this.name = 'NativeUnavailableError'
  }
}

export class NativePolicyError extends Error {
  readonly code = 'native.policy_rejected'

  constructor(message: string) {
    super(message)
    this.name = 'NativePolicyError'
  }
}

export class NativeCancelledError extends Error {
  readonly code = 'native.cancelled'

  constructor(message = 'native operation was cancelled') {
    super(message)
    this.name = 'NativeCancelledError'
  }
}

export class NativeOperationError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'NativeOperationError'
    this.code = code
  }
}
