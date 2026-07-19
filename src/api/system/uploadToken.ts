import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'

export type UploadProvider = 'cos'
export type UploadFileKind = 'image' | 'file'

export type UploadTokenRequest = NonNullable<AdminOperationInput<'post_api_admin_v1_upload_tokens'>['body']>

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

export type UploadTokenResponse = components['schemas']['Go_internal_module_uploadtoken_CreateResponse_Output']

export const UploadTokenApi = {
  create: (params: UploadTokenRequest, options: ExecuteOptions = {}): Promise<UploadTokenResponse> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_upload_tokens, { body: params }, options),
}
