import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse } from '@/types/common'

export type ClientPlatform = 'windows-x86_64' | 'darwin-x86_64'
export type CommonYesNo = 1 | 2

export interface ClientVersionPageInitResponse {
  dict: {
    client_version_platform_arr: DictOption<ClientPlatform>[]
    common_yes_no_arr: DictOption<CommonYesNo>[]
  }
}

export interface ClientVersionListParams {
  current_page: number
  page_size: number
  platform?: ClientPlatform | ''
}

interface ClientVersionListQueryParams {
  current_page: number
  page_size: number
  platform?: ClientPlatform
}

export interface ClientVersionItem {
  id: number
  version: string
  notes: string
  file_url: string
  signature: string
  platform: ClientPlatform
  platform_name: string
  file_size: number
  file_size_text: string
  is_latest: CommonYesNo
  is_latest_name: string
  force_update: CommonYesNo
  force_update_name: string
  created_at: string
  updated_at: string
}

export interface ClientVersionForm {
  id?: number
  version: string
  notes?: string
  file_url: string
  signature: string
  platform: ClientPlatform
  file_size: number
  force_update: CommonYesNo
}

export interface ClientVersionCreateResponse {
  id: number
}

export interface ClientVersionManifestPlatform {
  url: string
  signature: string
}

export interface ClientVersionUpdateJsonManifest {
  version: string
  notes: string
  pub_date: string
  platforms: Partial<Record<ClientPlatform, ClientVersionManifestPlatform>>
}

export type ClientVersionUpdateJsonResponse = ClientVersionUpdateJsonManifest | []

export interface ClientVersionCurrentCheckResponse {
  force_update: boolean
}

interface ClientVersionSaveBody {
  version: string
  notes?: string
  file_url: string
  signature: string
  platform: ClientPlatform
  file_size: number
  force_update: CommonYesNo
}

interface ClientVersionForceUpdateBody {
  force_update: CommonYesNo
}

function normalizeListParams(params: ClientVersionListParams): ClientVersionListQueryParams {
  const query: ClientVersionListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (params.platform) {
    query.platform = params.platform
  }

  return query
}

function toSaveBody(params: ClientVersionForm): ClientVersionSaveBody {
  return {
    version: params.version,
    notes: params.notes,
    file_url: params.file_url,
    signature: params.signature,
    platform: params.platform,
    file_size: params.file_size,
    force_update: params.force_update,
  }
}

function assertPositiveID(id: Id, label: string): number {
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }

  return id
}

function assertSingleID(id: Id | Id[]): number {
  if (Array.isArray(id)) {
    const [singleID] = id
    if (id.length !== 1 || singleID === undefined) {
      throw new Error('client version REST delete only supports one id')
    }
    return assertPositiveID(singleID, 'client version id')
  }

  return assertPositiveID(id, 'client version id')
}

const BASE = `${ADMIN_API_PREFIX}/client-versions`

export const ClientVersionApi = {
  init: () => request.get<ClientVersionPageInitResponse>(`${BASE}/page-init`),
  list: (params: ClientVersionListParams) => request.get<PaginatedResponse<ClientVersionItem>>(BASE, { params: normalizeListParams(params) }),
  add: (params: ClientVersionForm) => request.post<ClientVersionCreateResponse, ClientVersionSaveBody>(BASE, toSaveBody(params)),
  edit: (params: ClientVersionForm & { id: number }) => request.put<void, ClientVersionSaveBody>(`${BASE}/${assertPositiveID(params.id, 'client version id')}`, toSaveBody(params)),
  setLatest: (params: { id: Id }) => request.patch<void>(`${BASE}/${assertPositiveID(params.id, 'client version id')}/latest`),
  del: (params: { id: Id | Id[] }) => request.delete<void>(`${BASE}/${assertSingleID(params.id)}`),
  updateJson: (params: { platform?: ClientPlatform | '' }) => request.get<ClientVersionUpdateJsonResponse>(`${BASE}/update-json`, { params: params.platform ? { platform: params.platform } : undefined }),
  forceUpdate: (params: { id: Id; force_update: CommonYesNo }) => request.patch<void, ClientVersionForceUpdateBody>(`${BASE}/${assertPositiveID(params.id, 'client version id')}/force-update`, { force_update: params.force_update }),
  currentCheck: (params: { version: string; platform?: ClientPlatform | '' }) => request.get<ClientVersionCurrentCheckResponse>(`${BASE}/current-check`, { params: params.platform ? params : { version: params.version } }),
}

