import { legacyRequest } from '@/lib/http'

// 动态导入 SDK，只在实际上传时才加载
const loadCOS = () => import('cos-js-sdk-v5').then(m => m.default)
const loadOSS = async () => {
  try {
    // 用变量绕过 Vite 静态分析，实现真正的可选依赖
    const pkg = 'ali-oss'
    const m = await import(/* @vite-ignore */ pkg)
    return m.default
  } catch {
    throw new Error(
      '阿里云 OSS 依赖未安装。\n' +
      '请在 admin_front_ts 目录执行：npm install ali-oss\n' +
      '或切换上传驱动为腾讯云 COS'
    )
  }
}

export type Provider = 'cos' | 'oss'

export interface UploadCredentials {
    tmpSecretId: string
    tmpSecretKey: string
    sessionToken: string
}

export interface UploadRule {
    maxSize: number // MB
    imageExts: string[]
    fileExts: string[]
}

export interface UploadConfig {
    provider: Provider
    credentials: UploadCredentials
    startTime: number
    expiredTime: number
    uploadPath: string
    bucket: string
    region: string
    bucket_domain?: string  // CDN 域名
    rule?: UploadRule
}

// ✅ 统一接口
const API_TOKEN = '/api/getUploadToken'

export const getUploadToken = (params: any): Promise<UploadConfig> => {
    return legacyRequest.post(API_TOKEN, params)
}

export const validateFile = (file: File, config: UploadConfig, type: 'image' | 'file' = 'image') => {
    if (!config.rule) return

    const { maxSize, imageExts, fileExts } = config.rule

    // 1. Check Max Size
    if (maxSize && file.size > maxSize * 1024 * 1024) {
        throw new Error(`文件大小不能超过 ${maxSize}MB`)
    }

    // 2. Check Extension
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext) return // No extension, skip or error? usually skip

    const allowedExts = type === 'image' ? imageExts : fileExts
    if (allowedExts && allowedExts.length > 0 && !allowedExts.includes(ext)) {
        throw new Error(`不支持的文件类型 .${ext}，仅支持: ${allowedExts.join(', ')}`)
    }
}

function safeFileName(name: string) {
    // 避免空格、中文、特殊符号导致的 Key/URL 问题（你也可以换成 uuid）
    return name.replace(/[^\w.\-]/g, '_')
}

function joinKey(uploadPath: string, file: File) {
    const fileName = safeFileName(file.name || 'file')
    return `${uploadPath}${Date.now()}-${fileName}`
}

/** ✅ 统一上传入口：COS/OSS 都走这个 */
export const uploadFileToCloud = async (
    file: File,
    config: UploadConfig
): Promise<{ url: string; key: string }> => {
    if (!config?.credentials) throw new Error('Invalid upload config: missing credentials')

    const key = joinKey(config.uploadPath, file)

    if (config.provider === 'cos') {
        return uploadToCos(file, key, config)
    }

    if (config.provider === 'oss') {
        return uploadToOss(file, key, config)
    }

    throw new Error(`Unsupported provider: ${String((config as any).provider)}`)
}

// --------------------- COS ---------------------
const uploadToCos = async (
    file: File,
    key: string,
    config: UploadConfig
): Promise<{ url: string; key: string }> => {
    const { credentials, bucket, region } = config
    const COS = await loadCOS()

    const cos: any = new COS({
        getAuthorization(_: any, cb: any) {
            cb({
                TmpSecretId: credentials.tmpSecretId,
                TmpSecretKey: credentials.tmpSecretKey,
                SecurityToken: credentials.sessionToken,
                StartTime: config.startTime,
                ExpiredTime: config.expiredTime
            })
        }
    })

    return new Promise((resolve, reject) => {
        cos.putObject({ Bucket: bucket, Region: region, Key: key, Body: file }, (err: any) => {
            if (err) return reject(err)

            // 优先用后端下发的 bucket_domain（CDN），否则用默认域名
            const domain = config.bucket_domain || `${bucket}.cos.${region}.myqcloud.com`
            const url = `https://${domain}/${encodeURI(key)}`
            resolve({ url, key })
        })
    })
}

// --------------------- OSS ---------------------
const uploadToOss = async (
    file: File,
    key: string,
    config: UploadConfig
): Promise<{ url: string; key: string }> => {
    const { credentials, bucket, region } = config
    const OSS = await loadOSS()

    // ali-oss 的 region 一般形如：oss-cn-hangzhou
    const ossRegion = region.startsWith('oss-') ? region : `oss-${region}`

    const client = new OSS({
        region: ossRegion,
        bucket,
        accessKeyId: credentials.tmpSecretId,
        accessKeySecret: credentials.tmpSecretKey,
        stsToken: credentials.sessionToken,
        secure: true, // ✅ 强制 https
    })

    const result = await client.put(key, file)

    // result.url 通常会给出可访问地址（取决于桶权限/域名）
    // 如果没给，就按默认域名规则拼一个（有自定义域名/CDN时建议后端返回 baseUrl）
    const url =
        (result as any)?.url ||
        `https://${bucket}.${ossRegion}.aliyuncs.com/${encodeURI(key)}`

    return { url, key }
}
