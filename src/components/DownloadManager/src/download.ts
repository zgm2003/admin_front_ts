import { ElMessage, ElNotification } from 'element-plus'
import { getNativeBridge } from '@/adapters/native'
import i18n from '@/i18n'
import {
  NativePolicyError,
  type ManagedDownloadProgress,
  type NativeBridge,
  type NativeUnlisten,
} from '@/modules/native/types'
import { isDownloadUserCancelled, requireDownloadError } from './errors'

const t = i18n.global.t
const DEFAULT_DOWNLOAD_FILENAME = 'download'
const webDownloadHosts = new Set(['www.zgm2003.cn', 'cos.zgm2003.cn'])

function filenameFromURL(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url, globalThis.location?.href)
  } catch {
    return null
  }
  const filename = parsed.pathname.split('/').pop()?.trim()
  return filename || null
}

function resolveSuggestedDownloadFilename(url: string, filename?: string): string {
  const requestedFilename = filename?.trim()
  if (requestedFilename) return requestedFilename
  return filenameFromURL(url) ?? DEFAULT_DOWNLOAD_FILENAME
}

function validatedWebDownloadUrl(input: string): URL {
  const base = new URL(globalThis.location.href)
  let url: URL
  try {
    url = new URL(input, base)
  } catch {
    throw new NativePolicyError('download URL is invalid')
  }
  if (url.username || url.password) {
    throw new NativePolicyError('download URL credentials are forbidden')
  }
  const sameOrigin = url.origin === base.origin
  const allowlistedHttps = url.protocol === 'https:' && webDownloadHosts.has(url.hostname.toLowerCase())
  if (!sameOrigin && !allowlistedHttps) {
    throw new NativePolicyError('download URL is not allowlisted')
  }
  return url
}

export type DownloadProgress = ManagedDownloadProgress

export interface DownloadOptions {
  readonly url: string
  readonly filename?: string
  readonly onProgress?: (progress: DownloadProgress) => void
  readonly onCompleted?: (taskId: string) => void
  readonly onFailed?: (error: string) => void
}

class DownloadManager {
  private listeners: NativeUnlisten[] = []
  private listenerBridge: NativeBridge | null = null
  private listenerFlight: Promise<void> | null = null
  private downloads = new Map<string, DownloadProgress>()
  private callbacks = new Map<string, {
    onProgress?: (progress: DownloadProgress) => void
    onCompleted?: (taskId: string) => void
    onFailed?: (error: string) => void
  }>()

  private ensureListeners(): Promise<void> {
    const native = getNativeBridge()
    if (native.kind !== 'tauri' || this.listenerBridge === native) return Promise.resolve()
    if (this.listenerFlight) return this.listenerFlight
    this.listenerFlight = this.initListeners(native).finally(() => {
      this.listenerFlight = null
    })
    return this.listenerFlight
  }

  private async initListeners(native: NativeBridge): Promise<void> {
    for (const unlisten of this.listeners.splice(0)) unlisten()
    this.listenerBridge = native

    const progressListener = await native.downloads.listenProgress((progress) => {
      this.downloads.set(progress.id, progress)
      this.callbacks.get(progress.id)?.onProgress?.(progress)
    })
    const completedListener = await native.downloads.listenCompleted(async (id) => {
      const progress = await native.downloads.getProgress(id)
      if (progress) this.downloads.set(id, progress)
      const known = progress ?? this.downloads.get(id)
      if (!known) return
      const notification = ElNotification({
        title: t('download.completed'),
        message: `${known.filename} ${t('download.completed')}，${t('download.clickToOpen')}`,
        type: 'success',
        duration: 5000,
        onClick: () => {
          notification.close()
          void this.reveal(id)
        },
        customClass: 'download-notification-clickable',
      })
      this.callbacks.get(id)?.onCompleted?.(id)
    })
    const failedListener = await native.downloads.listenFailed(({ taskId, message }) => {
      const progress = this.downloads.get(taskId)
      if (progress?.status === 'cancelled') return
      ElNotification({
        title: t('download.failed'),
        message: progress ? `${progress.filename}: ${message}` : message,
        type: 'error',
        duration: 5000,
      })
      this.callbacks.get(taskId)?.onFailed?.(message)
    })
    this.listeners.push(progressListener, completedListener, failedListener)
  }

  async download(options: DownloadOptions): Promise<string> {
    const native = getNativeBridge()
    if (native.kind !== 'tauri') {
      throw new NativePolicyError(t('download.webNotSupported'))
    }
    await this.ensureListeners()
    const id = await native.downloads.start({
      url: options.url,
      suggestedFilename: resolveSuggestedDownloadFilename(options.url, options.filename),
    })
    this.callbacks.set(id, {
      onProgress: options.onProgress,
      onCompleted: options.onCompleted,
      onFailed: options.onFailed,
    })
    globalThis.dispatchEvent(new CustomEvent('download-started'))
    return id
  }

  async cancel(id: string): Promise<void> {
    const native = getNativeBridge()
    if (native.kind !== 'tauri') return
    await native.downloads.cancel(id)
    this.downloads.delete(id)
    this.callbacks.delete(id)
  }

  async getProgress(id: string): Promise<DownloadProgress | null> {
    const native = getNativeBridge()
    if (native.kind !== 'tauri') return null
    await this.ensureListeners()
    const progress = await native.downloads.getProgress(id)
    if (progress) this.downloads.set(id, progress)
    return progress
  }

  async getAllDownloads(): Promise<DownloadProgress[]> {
    const native = getNativeBridge()
    if (native.kind !== 'tauri') return []
    await this.ensureListeners()
    const downloads = await native.downloads.getAll()
    downloads.forEach((download) => this.downloads.set(download.id, download))
    return downloads
  }

  async remove(id: string): Promise<void> {
    const native = getNativeBridge()
    if (native.kind !== 'tauri') return
    await native.downloads.remove(id)
    this.downloads.delete(id)
    this.callbacks.delete(id)
  }

  async reveal(id: string): Promise<void> {
    const native = getNativeBridge()
    if (native.kind !== 'tauri') return
    await native.downloads.reveal(id)
    ElMessage.success(t('download.folderOpened'))
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const index = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)))
    return `${(bytes / Math.pow(k, index)).toFixed(2)} ${sizes[index]}`
  }

  formatSpeed(bytesPerSecond: number): string {
    return `${this.formatSize(bytesPerSecond)}/s`
  }
}

export const downloadManager = new DownloadManager()

export const downloadFile = async (
  url: string,
  filename?: string,
  options?: Omit<DownloadOptions, 'url' | 'filename'>,
): Promise<string | undefined> => {
  if (getNativeBridge().kind === 'tauri') {
    try {
      return await downloadManager.download({ url, filename, ...options })
    } catch (error: unknown) {
      if (isDownloadUserCancelled(error, t('download.userCancelled'))) return undefined
      throw requireDownloadError(error, 'download')
    }
  }

  try {
    const safeUrl = validatedWebDownloadUrl(url)
    const response = await fetch(safeUrl)
    if (!response.ok) throw new Error(`${t('download.failed')}: ${response.status}`)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    try {
      link.href = blobUrl
      link.download = resolveSuggestedDownloadFilename(safeUrl.href, filename)
      document.body.appendChild(link)
      link.click()
    } finally {
      link.remove()
      URL.revokeObjectURL(blobUrl)
    }
  } catch (error: unknown) {
    throw requireDownloadError(error, 'web download')
  }
  return undefined
}

export const openUrl = async (url: string): Promise<void> => {
  getNativeBridge().window.openExternal(url)
}
