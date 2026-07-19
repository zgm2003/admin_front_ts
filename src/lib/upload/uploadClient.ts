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
    params: { Bucket: string; Region: string; Key: string; Body: File },
    callback: (error: Error | null) => void
  ): void
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

const loadCOS = () => import('cos-js-sdk-v5').then(module => module.default as CosConstructor)
const t = i18n.global.t

export const getUploadToken = (params: UploadTokenParams): Promise<UploadTokenResponse> => {
  return UploadTokenApi.create(normalizeTokenRequest(params))
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
  config: UploadConfig
): Promise<{ url: string; key: string }> => {
  if (config.provider !== 'cos') {
    throw new Error(t('uploadRuntime.ossUnsupported'))
  }

  return uploadToCos(file, config.key, config)
}

const uploadToCos = async (
  file: File,
  key: string,
  config: UploadConfig
): Promise<{ url: string; key: string }> => {
  const { credentials, bucket, region } = config
  const COS = await loadCOS()

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
    cos.putObject({ Bucket: bucket, Region: region, Key: key, Body: file }, (error: Error | null) => {
      if (error) {
        reject(error)
        return
      }

      const url = buildPublicFileURL(config.bucket_domain, bucket, region, key)
      resolve({ url, key })
    })
  })
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
    || value === 'exports'
    || value === 'reconcile_reports'
}
