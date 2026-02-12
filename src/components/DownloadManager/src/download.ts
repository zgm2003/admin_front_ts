/**
 * 统一下载工具 - 自动适配浏览器和 Tauri 环境
 * Tauri 环境提供完整的桌面下载体验（进度、暂停、取消）
 */
import type { UnlistenFn } from '@tauri-apps/api/event'
import { ElMessage, ElNotification } from 'element-plus'
import { isTauri } from '@/store/tauri'

// 动态导入 Tauri API，避免 Web 环境加载失败
const tauriCore = () => import('@tauri-apps/api/core')
const tauriEvent = () => import('@tauri-apps/api/event')
const tauriDialog = () => import('@tauri-apps/plugin-dialog')

// ==================== 类型定义 ====================

export interface DownloadProgress {
  id: string
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled'
  downloaded: number
  total: number
  speed: number
  progress: number
  filename: string
  save_path: string
  error?: string
}

export interface DownloadOptions {
  url: string
  filename?: string
  onProgress?: (progress: DownloadProgress) => void
  onCompleted?: (savePath: string) => void
  onFailed?: (error: string) => void
}

// ==================== 下载管理器类 ====================

class DownloadManager {
  private listeners: UnlistenFn[] = []
  private downloads = new Map<string, DownloadProgress>()
  private callbacks = new Map<string, {
    onProgress?: (progress: DownloadProgress) => void
    onCompleted?: (savePath: string) => void
    onFailed?: (error: string) => void
  }>()

  constructor() {
    if (isTauri()) {
      this.initListeners()
    }
  }

  private async initListeners() {
    const { listen } = await tauriEvent()
    const progressListener = await listen<DownloadProgress>('download-progress', (event) => {
      const progress = event.payload
      this.downloads.set(progress.id, progress)
      this.callbacks.get(progress.id)?.onProgress?.(progress)
    })

    const completedListener = await listen<string>('download-completed', (event) => {
      const id = event.payload
      const progress = this.downloads.get(id)
      
      if (progress) {
        ElNotification({
          title: '下载完成',
          message: `${progress.filename} 已保存到 ${progress.save_path}`,
          type: 'success',
          duration: 5000,
          onClick: () => this.openFolder(progress.save_path),
        })
        this.callbacks.get(id)?.onCompleted?.(progress.save_path)
      }
    })

    const failedListener = await listen<[string, string]>('download-failed', (event) => {
      const [id, error] = event.payload
      const progress = this.downloads.get(id)
      
      if (progress && !error.includes('取消')) {
        ElNotification({
          title: '下载失败',
          message: `${progress.filename}: ${error}`,
          type: 'error',
          duration: 5000,
        })
        this.callbacks.get(id)?.onFailed?.(error)
      }
    })

    this.listeners.push(progressListener, completedListener, failedListener)
  }

  async download(options: DownloadOptions): Promise<string> {
    if (!isTauri()) {
      window.open(options.url, '_blank')
      throw new Error('Web 环境不支持下载管理')
    }

    const { save } = await tauriDialog()
    const { invoke } = await tauriCore()
    const urlFilename = options.url.split('/').pop()?.split('?')[0] || 'download'
    const suggestedFilename = options.filename || urlFilename

    const savePath = await save({
      defaultPath: suggestedFilename,
      filters: this.getFileFilters(suggestedFilename),
    })

    if (!savePath) throw new Error('用户取消下载')

    const id = `download_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    this.callbacks.set(id, {
      onProgress: options.onProgress,
      onCompleted: options.onCompleted,
      onFailed: options.onFailed,
    })

    const filename = savePath.split(/[/\\]/).pop() || suggestedFilename
    await invoke('start_download', { id, url: options.url, savePath, filename })
    return id
  }

  async cancel(id: string) {
    if (!isTauri()) return
    try {
      const { invoke } = await tauriCore()
      await invoke('cancel_download', { id })
      this.downloads.delete(id)
      this.callbacks.delete(id)
    } catch (error) {
      console.error('[cancel] Error:', error)
    }
  }

  async getProgress(id: string): Promise<DownloadProgress | null> {
    if (!isTauri()) return null
    try {
      const { invoke } = await tauriCore()
      const progress = await invoke<DownloadProgress | null>('get_download_progress', { id })
      if (progress) this.downloads.set(id, progress)
      return progress
    } catch {
      return null
    }
  }

  async getAllDownloads(): Promise<DownloadProgress[]> {
    if (!isTauri()) return []
    try {
      const { invoke } = await tauriCore()
      const downloads = await invoke<DownloadProgress[]>('get_all_downloads')
      downloads.forEach(d => this.downloads.set(d.id, d))
      return downloads
    } catch {
      return []
    }
  }

  async remove(id: string) {
    if (!isTauri()) return
    const { invoke } = await tauriCore()
    await invoke('remove_download', { id })
    this.downloads.delete(id)
    this.callbacks.delete(id)
  }

  async openFolder(savePath: string) {
    if (!isTauri()) return
    try {
      const { invoke } = await tauriCore()
      await invoke('open_file_folder', { path: savePath })
      ElMessage.success('已打开文件夹')
    } catch (error) {
      console.error('[openFolder] Error:', error)
      ElMessage.error('打开文件夹失败')
    }
  }

  private getFileFilters(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase()
    const filterMap: Record<string, { name: string; extensions: string[] }> = {
      'pdf': { name: 'PDF 文档', extensions: ['pdf'] },
      'doc': { name: 'Word 文档', extensions: ['doc', 'docx'] },
      'docx': { name: 'Word 文档', extensions: ['doc', 'docx'] },
      'xls': { name: 'Excel 表格', extensions: ['xls', 'xlsx'] },
      'xlsx': { name: 'Excel 表格', extensions: ['xls', 'xlsx'] },
      'zip': { name: '压缩文件', extensions: ['zip', 'rar', '7z'] },
      'jpg': { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
      'png': { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
      'mp4': { name: '视频文件', extensions: ['mp4', 'avi', 'mkv', 'mov'] },
      'mp3': { name: '音频文件', extensions: ['mp3', 'wav', 'flac'] },
    }
    const filter = ext ? filterMap[ext] : undefined
    return filter ? [filter, { name: '所有文件', extensions: ['*'] }] : [{ name: '所有文件', extensions: ['*'] }]
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  formatSpeed(bytesPerSecond: number): string {
    return `${this.formatSize(bytesPerSecond)}/s`
  }
}

// ==================== 导出单例 ====================

export const downloadManager = new DownloadManager()

// ==================== 便捷方法 ====================

export const downloadFile = async (
  url: string,
  filename?: string,
  options?: Omit<DownloadOptions, 'url' | 'filename'>
): Promise<string | undefined> => {
  if (isTauri()) {
    try {
      return await downloadManager.download({ url, filename, ...options })
    } catch (error: any) {
      // 用户取消下载，直接返回，不做任何操作
      if (error.message === '用户取消下载') {
        return undefined
      }
      // 其他错误，记录日志并抛出
      console.error('[download] Error:', error)
      throw error
    }
  }

  // Web 环境：通过 fetch blob 强制下载（解决跨域 COS 链接 <a download> 无效的问题）
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`下载失败: ${resp.status}`)
    const blob = await resp.blob()
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename || url.split('/').pop()?.split('?')[0] || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch (err: any) {
    console.error('[downloadFile] Web fetch error:', err)
    // 兜底：直接打开
    window.open(url, '_blank')
  }
  return undefined
}

export const openUrl = async (url: string) => {
  if (isTauri()) {
    try {
      const { invoke } = await tauriCore()
      await invoke('plugin:opener|open_url', { url })
    } catch (e) {
      console.error('[openUrl] Error:', e)
      window.open(url, '_blank')
    }
  } else {
    window.open(url, '_blank')
  }
}
