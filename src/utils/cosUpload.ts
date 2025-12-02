import request from '@/utils/request'
import COS from 'cos-js-sdk-v5'

export interface CosCredentials { tmpSecretId: string; tmpSecretKey: string; sessionToken: string }
export interface CosConfig { credentials: CosCredentials; startTime: number; expiredTime: number; uploadPath: string; bucket: string; region: string }

export const getCosUploadToken = (params: any): Promise<CosConfig> => request.post('/api/getUploadToken', params)

export const uploadFileToCos = async (file: File, config: CosConfig): Promise<{ url: string; key: string }> => {
  if (!config || !config.credentials) throw new Error('Invalid COS config: missing credentials')
  const { credentials, uploadPath, bucket, region } = config
  const cos: any = new COS({ getAuthorization(_: any, cb: any){ cb({ TmpSecretId: credentials.tmpSecretId, TmpSecretKey: credentials.tmpSecretKey, SecurityToken: credentials.sessionToken, StartTime: config.startTime, ExpiredTime: config.expiredTime }) } })
  const fileKey = `${uploadPath}${Date.now()}-${(file as any).name}`
  return new Promise((resolve, reject) => {
    cos.putObject({ Bucket: bucket, Region: region, Key: fileKey, Body: file }, (err: any) => {
      if (err) return reject(err)
      const url = `https://${bucket}.cos.${region}.myqcloud.com/${fileKey}`
      resolve({ url, key: fileKey })
    })
  })
}
