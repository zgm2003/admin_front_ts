import { legacyRequest } from '@/lib/http'
import type { Id, PaginatedResponse, RequestPayload } from '@/types/common'

export interface TauriVersionInitResponse {
  dict: {
    tauri_platform_arr: Array<{ label: string; value: string }>
  }
}

export interface TauriVersionListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  platform?: string
}

export interface TauriVersionItem {
  id: number
  version: string
  notes?: string | null
  file_url: string
  signature: string
  platform: string
  file_size: number
  file_size_text: string
  is_latest: number
  force_update: number
  created_at: string
  updated_at: string
}

export interface TauriVersionForm {
  id?: number
  version: string
  notes?: string | null
  file_url: string
  signature: string
  platform: string
  file_size: number
  force_update: number
}

export interface TauriVersionManifestPlatform {
  url: string
  signature: string
}

export interface TauriVersionUpdateJsonManifest {
  version: string
  notes: string
  pub_date: string
  platforms: Record<string, TauriVersionManifestPlatform>
}

export type TauriVersionUpdateJsonResponse = TauriVersionUpdateJsonManifest | []

export const TauriVersionApi = {
  init: () => legacyRequest.post<TauriVersionInitResponse>('/api/admin/TauriVersion/init'),
  list: (params: TauriVersionListParams) => legacyRequest.post<PaginatedResponse<TauriVersionItem>>('/api/admin/TauriVersion/list', params),
  add: (params: TauriVersionForm) => legacyRequest.post<{ id: number }>('/api/admin/TauriVersion/add', params),
  edit: (params: TauriVersionForm) => legacyRequest.post<void>('/api/admin/TauriVersion/edit', params),
  setLatest: (params: { id: Id }) => legacyRequest.post<void>('/api/admin/TauriVersion/setLatest', params),
  del: (params: { id: Id }) => legacyRequest.post<void>('/api/admin/TauriVersion/del', params),
  updateJson: (params: { platform?: string }) => legacyRequest.post<TauriVersionUpdateJsonResponse>('/api/admin/TauriVersion/updateJson', params),
  forceUpdate: (params: { id: Id; force_update: number }) => legacyRequest.post<void>('/api/admin/TauriVersion/forceUpdate', params),
  clientInit: (params: { version: string; platform?: string }) => legacyRequest.post<{ force_update: boolean }>('/api/TauriVersion/clientInit', params),
}
