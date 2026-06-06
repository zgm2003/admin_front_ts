export interface ApiEnvelope<T = unknown> {
  code: number
  msg: string
  data: T
}

export interface DictOption<T = number | string> {
  label: string
  value: T
}

export interface PageInfo {
  page_size: number
  current_page: number
  total_page?: number
  total: number
}

export interface PaginatedResponse<T> {
  list: T[]
  page: PageInfo
}

export interface RemoteListResponse<T> {
  list: T[]
  page: Pick<PageInfo, 'total'> & Partial<PageInfo>
}

export interface Identifiable {
  id: number | string
}

export type Id = Identifiable['id']

export type RequestPayload = Record<string, unknown>

export type RemoteListParams = object

export type RemoteListFetchMethod<
  Item = object,
  Params extends RemoteListParams = RemoteListParams,
> = {
  bivarianceHack(params: Params): Promise<RemoteListResponse<Item>>
}['bivarianceHack']
