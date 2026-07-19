import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
  type AdminOperationOutput,
} from '@/modules/http/generated/operations'
import type { DictOption, Id } from '@/types/common'

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

type ClientVersionListQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_client_versions'>['query']>

type ClientVersionContractItem = components['schemas']['Go_internal_module_clientversion_ListItem_Output']
export interface ClientVersionItem extends Omit<ClientVersionContractItem, 'platform' | 'is_latest' | 'force_update'> {
  platform: ClientPlatform
  is_latest: CommonYesNo
  force_update: CommonYesNo
}
export interface ClientVersionListResponse extends Omit<components['schemas']['Go_internal_module_clientversion_ListResponse_Output'], 'list'> {
  list: ClientVersionItem[]
}

type ClientVersionSaveBody = NonNullable<AdminOperationInput<'post_api_admin_v1_client_versions'>['body']>
export type ClientVersionForm = ClientVersionSaveBody & { id?: number }

export type ClientVersionCreateResponse = components['schemas']['Go_internal_server_adminroute_IDData_Output']

export interface ClientVersionManifestPlatform {
  url: string
  signature: string
}

export type ClientVersionUpdateJsonManifest = components['schemas']['Go_internal_module_clientversion_ManifestPayload_Output']

export type ClientVersionUpdateJsonResponse = ClientVersionUpdateJsonManifest | []

export type ClientVersionCurrentCheckResponse = components['schemas']['Go_internal_module_clientversion_CurrentCheckResponse_Output']
type ClientVersionUpdateJsonContract = AdminOperationOutput<'get_api_admin_v1_client_versions_update_json'>

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

function toClientVersionItem(item: ClientVersionContractItem): ClientVersionItem {
  if (
    (item.platform !== 'windows-x86_64' && item.platform !== 'darwin-x86_64')
    || (item.is_latest !== 1 && item.is_latest !== 2)
    || (item.force_update !== 1 && item.force_update !== 2)
  ) {
    throw new Error('client version list item violates the editable contract')
  }
  return {
    ...item,
    platform: item.platform,
    is_latest: item.is_latest,
    force_update: item.force_update,
  }
}

function isClientPlatform(value: string): value is ClientPlatform {
  return value === 'windows-x86_64' || value === 'darwin-x86_64'
}

function isCommonYesNo(value: number): value is CommonYesNo {
  return value === 1 || value === 2
}

function exactUpdateJson(response: ClientVersionUpdateJsonContract): ClientVersionUpdateJsonResponse {
  if (Array.isArray(response)) {
    if (response.length !== 0) throw new Error('client version update-json array must be exactly empty')
    return []
  }
  return response
}

export const ClientVersionApi = {
  pageInit: async (options: ExecuteOptions = {}): Promise<ClientVersionPageInitResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_client_versions_page_init, {}, options)
    const platforms = response.dict.client_version_platform_arr.map((option) => {
      const value = option.value
      if (!isClientPlatform(value)) {
        throw new Error('client version platform dictionary violates the editable contract')
      }
      return { label: option.label, value }
    })
    const yesNo = response.dict.common_yes_no_arr.map((option) => {
      const value = option.value
      if (!isCommonYesNo(value)) throw new Error('client version yes/no dictionary violates the editable contract')
      return { label: option.label, value }
    })
    return { dict: { client_version_platform_arr: platforms, common_yes_no_arr: yesNo } }
  },
  list: async (params: ClientVersionListParams, options: ExecuteOptions = {}): Promise<ClientVersionListResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_client_versions, {
      query: normalizeListParams(params),
    }, options)
    return { list: response.list.map(toClientVersionItem), page: response.page }
  },
  create: (params: ClientVersionForm, options: ExecuteOptions = {}): Promise<ClientVersionCreateResponse> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_client_versions, { body: toSaveBody(params) }, options),
  async update(params: ClientVersionForm & { id: number }, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.put_api_admin_v1_client_versions_id, {
      path: { id: assertPositiveID(params.id, 'client version id') },
      body: toSaveBody(params),
    }, options)
  },
  async setLatest(params: { id: Id }, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.patch_api_admin_v1_client_versions_id_latest, {
      path: { id: assertPositiveID(params.id, 'client version id') },
    }, options)
  },
  async deleteOne(params: { id: Id | Id[] }, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.delete_api_admin_v1_client_versions_id, {
      path: { id: assertSingleID(params.id) },
    }, options)
  },
  updateJson: async (params: { platform?: ClientPlatform | '' }, options: ExecuteOptions = {}): Promise<ClientVersionUpdateJsonResponse> => {
    const query = params.platform ? { platform: params.platform } : undefined
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_client_versions_update_json, { query }, options)
    return exactUpdateJson(response)
  },
  async forceUpdate(params: { id: Id; force_update: CommonYesNo }, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.patch_api_admin_v1_client_versions_id_force_update, {
      path: { id: assertPositiveID(params.id, 'client version id') },
      body: { force_update: params.force_update },
    }, options)
  },
  currentCheck: (params: { version: string; platform?: ClientPlatform | '' }, options: ExecuteOptions = {}): Promise<ClientVersionCurrentCheckResponse> => {
    const query = params.platform ? { version: params.version, platform: params.platform } : { version: params.version }
    return executeAdminOperation(adminOperations.get_api_admin_v1_client_versions_current_check, { query }, options)
  },
}
