export type NativeUnlisten = () => void

export interface NativeWindowState {
  readonly minimized: boolean
  readonly maximized: boolean
  readonly focused: boolean
  readonly visible: boolean
}

export interface WindowBridge {
  getState(): Promise<NativeWindowState>
  minimize(): Promise<void>
  toggleMaximize(): Promise<void>
  hide(): Promise<void>
  requestClose(): Promise<void>
  listenResize(listener: () => void): Promise<NativeUnlisten>
  listenCloseRequested(listener: () => void): Promise<NativeUnlisten>
  openExternal(url: string): void
  openSameOrigin(path: string): void
}

export type UpdaterDownloadEvent =
  | { readonly event: 'Started'; readonly data: { readonly contentLength?: number } }
  | { readonly event: 'Progress'; readonly data: { readonly chunkLength: number } }
  | { readonly event: 'Finished'; readonly data: Record<string, never> }

export interface NativeUpdate {
  readonly version: string
  readonly body?: string
  download(listener: (event: UpdaterDownloadEvent) => void): Promise<void>
  install(): Promise<void>
}

export interface UpdaterBridge {
  getCurrentVersion(): Promise<string>
  check(): Promise<NativeUpdate | null>
}

export interface NotificationBridge {
  shouldUseNative(): Promise<boolean>
  send(title: string, body: string): Promise<void>
}

export interface DesktopRefreshCredential {
  readonly refreshToken: string
}

export interface NativeAccessCredential {
  readonly accessToken: string
  readonly expiresAt: number
}

export interface DesktopCredentialBridge {
  seal(credential: DesktopRefreshCredential): Promise<void>
  refresh(deviceId: string): Promise<NativeAccessCredential>
  clear(): Promise<void>
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

export interface ProcessBridge {
  relaunch(): Promise<void>
  exit(code: number): Promise<void>
}

export interface NativeBridge {
  readonly kind: 'web' | 'tauri'
  readonly window: WindowBridge
  readonly updater: UpdaterBridge
  readonly notifications: NotificationBridge
  readonly credentials: DesktopCredentialBridge
  readonly downloads: ManagedDownloadBridge
  readonly process: ProcessBridge
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
