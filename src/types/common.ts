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

export interface CursorPaginatedResponse<T> {
  list: T[]
  next_cursor: number | string | null
  has_more: boolean
}

export interface RemoteListResponse<T> {
  list: T[]
  total?: number
  page?: Pick<PageInfo, 'total'> & Partial<PageInfo>
}

export interface Identifiable {
  id: number | string
}

export type Id = Identifiable['id']

export type RequestPayload = Record<string, unknown>

export type RemoteListFetchMethod<Item = object> = {
  bivarianceHack(params: any): Promise<RemoteListResponse<Item>>
}['bivarianceHack']
