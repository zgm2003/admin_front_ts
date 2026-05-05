import {
  UploadTokenApi,
  type UploadFileKind,
  type UploadTokenRequest,
  type UploadTokenResponse,
} from '@/api/system/uploadToken'

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
  fileName?: string
  fileSize?: number
  fileKind?: UploadFileKind
}

export type UploadTokenParams = UploadTokenRequest | LegacyUploadTokenRequest

const loadCOS = () => import('cos-js-sdk-v5').then(module => module.default as CosConstructor)

export const getUploadToken = (params: UploadTokenParams): Promise<UploadTokenResponse> => {
  return UploadTokenApi.create(normalizeTokenRequest(params))
}

export const validateFile = (file: File, config: UploadConfig, type: UploadFileKind = 'image') => {
  const { max_size_mb, image_exts, file_exts } = config.rule

  if (max_size_mb && file.size > max_size_mb * 1024 * 1024) {
    throw new Error(`文件大小不能超过 ${max_size_mb}MB`)
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext) {
    throw new Error('文件类型不支持')
  }

  const allowedExts = type === 'image' ? image_exts : file_exts
  if (allowedExts.length > 0 && !allowedExts.includes(ext)) {
    throw new Error(`不支持的文件类型 .${ext}，仅支持: ${allowedExts.join(', ')}`)
  }
}

export const uploadFileToCloud = async (
  file: File,
  config: UploadConfig
): Promise<{ url: string; key: string }> => {
  if (config.provider !== 'cos') {
    throw new Error('当前版本未启用 OSS 上传运行时，请安装可选扩展或切换为 COS')
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

      const domain = config.bucket_domain || `${bucket}.cos.${region}.myqcloud.com`
      const url = `https://${domain}/${encodeURI(key)}`
      resolve({ url, key })
    })
  })
}

function normalizeTokenRequest(params: UploadTokenParams): UploadTokenRequest {
  if ('folder' in params) {
    return params
  }

  return {
    folder: params.folderName,
    file_name: params.fileName || 'file',
    file_size: params.fileSize || 1,
    file_kind: params.fileKind || 'file',
  }
}
