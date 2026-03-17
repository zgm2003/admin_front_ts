import type { CursorPaginatedResponse, RequestPayload } from '@/types/common'

export interface LogStreamItem {
  id: number | string
  created_at: string
}

type CursorPaginationParams = {
  cursor?: number | string
  page_size: number
}

type CursorRequest<P extends RequestPayload> =
  CursorPaginationParams & Partial<Omit<P, keyof CursorPaginationParams>>

export interface LogStreamApi<
  T extends LogStreamItem = LogStreamItem,
  P extends CursorPaginationParams & RequestPayload = CursorPaginationParams & RequestPayload,
> {
  listCursor(params: CursorRequest<P>): Promise<CursorPaginatedResponse<T>>
}

export type CursorPaginateResponse<T = LogStreamItem> = CursorPaginatedResponse<T>
