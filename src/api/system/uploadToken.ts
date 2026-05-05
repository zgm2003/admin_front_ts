import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'

export type UploadProvider = 'cos'
export type UploadFileKind = 'image' | 'file'

export interface UploadTokenRequest {
  folder: string
  file_name: string
  file_size: number
  file_kind: UploadFileKind
}

export interface UploadCredentials {
  tmp_secret_id: string
  tmp_secret_key: string
  session_token: string
}

export interface UploadRule {
  max_size_mb: number
  image_exts: string[]
  file_exts: string[]
}

export interface UploadTokenResponse {
  provider: UploadProvider
  bucket: string
  region: string
  key: string
  upload_path: string
  bucket_domain: string | null
  credentials: UploadCredentials
  start_time: number
  expired_time: number
  rule: UploadRule
}

const BASE = `${ADMIN_API_PREFIX}/upload-tokens`

export const UploadTokenApi = {
  create: (params: UploadTokenRequest) => request.post<UploadTokenResponse, UploadTokenRequest>(BASE, params),
}
