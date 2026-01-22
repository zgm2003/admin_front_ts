/** 日志条目基础接口 */
export interface LogStreamItem {
  id: number | string
  created_at: string
  [key: string]: any
}

/** 游标分页响应 */
export interface CursorPaginateResponse<T = any> {
  list: T[]
  next_cursor: number | string | null
  has_more: boolean
}

/** API 方法类型（泛型支持） */
export interface LogStreamApi<T = LogStreamItem> {
  listCursor: (params: any) => Promise<CursorPaginateResponse<T>>
}
