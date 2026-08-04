import {
  UploadTokenApi,
  type UploadFileKind,
  type UploadTokenRequest,
  type UploadTokenResponse,
} from '@/api/system/uploadToken'
import i18n from '@/i18n'
import { buildPublicFileURL } from './url'

interface CosAuthorization {
  TmpSecretId: string
  TmpSecretKey: string
  SecurityToken: string
  StartTime: number
  ExpiredTime: number
}

interface CosClient {
  putObject(
    params: {
      Bucket: string
      Region: string
      Key: string
      Body: File
      onTaskReady?: (taskId: string) => void
    },
    callback: (error: Error | null, data?: { ETag?: string }) => void
  ): void
  cancelTask(taskId: string): void
}

type CosConstructor = new (options: {
  getAuthorization: (_options: unknown, callback: (authorization: CosAuthorization) => void) => void
}) => CosClient

export type Provider = 'cos'
export type UploadConfig = UploadTokenResponse
export type UploadCredentials = UploadTokenResponse['credentials']
export type UploadRule = UploadTokenResponse['rule']

export interface LegacyUploadTokenRequest {
  folderName: string
  fileName: string
  fileSize: number
  fileKind: UploadFileKind
}

export type UploadTokenParams = UploadTokenRequest | LegacyUploadTokenRequest

const loadCOS = () => import('cos-js-sdk-v5/index.js').then(module => module.default as CosConstructor)
const t = i18n.global.t

export const getUploadToken = (
  params: UploadTokenParams,
  signal?: AbortSignal,
): Promise<UploadTokenResponse> => {
  return UploadTokenApi.create(normalizeTokenRequest(params), { signal })
}

export const validateFile = (file: File, config: UploadConfig, type: UploadFileKind = 'image') => {
  const { max_size_mb, image_exts, file_exts } = config.rule

  if (max_size_mb && file.size > max_size_mb * 1024 * 1024) {
    throw new Error(t('uploadRuntime.maxSize', { size: max_size_mb }))
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext) {
    throw new Error(t('uploadRuntime.unsupportedType'))
  }

  const allowedExts = type === 'image' ? image_exts : file_exts
  if (allowedExts.length > 0 && !allowedExts.includes(ext)) {
    throw new Error(t('uploadRuntime.unsupportedExt', { ext, exts: allowedExts.join(', ') }))
  }
}

export const uploadFileToCloud = async (
  file: File,
  config: UploadConfig,
  signal?: AbortSignal,
): Promise<{ url: string; key: string; etag?: string }> => {
  if (config.provider !== 'cos') {
    throw new Error(t('uploadRuntime.ossUnsupported'))
  }

  return uploadToCos(file, config.key, config, signal)
}

const uploadToCos = async (
  file: File,
  key: string,
  config: UploadConfig,
  signal?: AbortSignal,
): Promise<{ url: string; key: string; etag?: string }> => {
  const { credentials, bucket, region } = config
  throwIfAborted(signal)
  const COS = await loadCOS()
  throwIfAborted(signal)

  const cos = new COS({
    getAuthorization(_options: unknown, callback: (authorization: CosAuthorization) => void) {
      callback({
        TmpSecretId: credentials.tmp_secret_id,
        TmpSecretKey: credentials.tmp_secret_key,
        SecurityToken: credentials.session_token,
        StartTime: config.start_time,
        ExpiredTime: config.expired_time,
      })
    },
  })

  return new Promise((resolve, reject) => {
    let taskId: string | undefined
    let settled = false

    const finish = (complete: () => void) => {
      if (settled) return
      settled = true
      signal?.removeEventListener('abort', handleAbort)
      complete()
    }
    const handleAbort = () => {
      if (taskId) cos.cancelTask(taskId)
      finish(() => reject(uploadAbortedError()))
    }

    if (signal?.aborted) {
      handleAbort()
      return
    }
    signal?.addEventListener('abort', handleAbort, { once: true })

    try {
      cos.putObject({
        Bucket: bucket,
        Region: region,
        Key: key,
        Body: file,
        onTaskReady(readyTaskId) {
          taskId = readyTaskId
          if (signal?.aborted) cos.cancelTask(readyTaskId)
        },
      }, (error: Error | null, data) => {
        if (error) {
          finish(() => reject(error))
          return
        }

        const url = buildPublicFileURL(config.bucket_domain, bucket, region, key)
        finish(() => resolve({ url, key, etag: data?.ETag }))
      })
    } catch (error) {
      finish(() => reject(error))
    }
  })
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw uploadAbortedError()
}

function uploadAbortedError() {
  return new DOMException('Upload aborted', 'AbortError')
}

function normalizeTokenRequest(params: UploadTokenParams): UploadTokenRequest {
  if ('folder' in params) {
    return params
  }

  if (!isUploadFolder(params.folderName)) {
    throw new Error('upload folder violates the Admin upload-token contract')
  }

  return {
    folder: params.folderName,
    file_name: params.fileName,
    file_size: params.fileSize,
    file_kind: params.fileKind,
  }
}

function isUploadFolder(value: string): value is UploadTokenRequest['folder'] {
  return value === 'avatars'
    || value === 'images'
    || value === 'videos'
    || value === 'cover_images'
    || value === 'ai-agents'
    || value === 'ai_chat_images'
    || value === 'ai_chat_attachments'
    || value === 'ai_context_documents'
    || value === 'exports'
    || value === 'reconcile_reports'
}
