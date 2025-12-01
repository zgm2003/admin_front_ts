import request from '@/utils/request'
import COS from 'cos-js-sdk-v5'

export function getCosUploadToken(params) { return request.post('/api/getUploadToken', params) }
export async function uploadFileToCos(file, config) {
  if (!config || !config.credentials) throw new Error('Invalid COS config: missing credentials')
  const { credentials, uploadPath, bucket, region } = config
  const cos = new COS({ getAuthorization(_, cb){ cb({ TmpSecretId: credentials.tmpSecretId, TmpSecretKey: credentials.tmpSecretKey, SecurityToken: credentials.sessionToken, StartTime: config.startTime, ExpiredTime: config.expiredTime }) } })
  const fileKey = `${uploadPath}${Date.now()}-${file.name}`
  return new Promise((resolve, reject) => {
    cos.putObject({ Bucket: bucket, Region: region, Key: fileKey, Body: file }, (err) => {
      if (err) return reject(err)
      const url = `https://${bucket}.cos.${region}.myqcloud.com/${fileKey}`
      resolve({ url, key: fileKey })
    })
  })
}
