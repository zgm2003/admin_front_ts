import { ref, type Ref } from 'vue'
import type { LogStreamItem, LogStreamApi } from '../types'

export interface UseLogStreamOptions<T extends LogStreamItem = LogStreamItem> {
  api: LogStreamApi<T>
  searchForm?: Ref<Record<string, any>>
  pageSize?: number
  /** 初始化时自动加载 */
  immediate?: boolean
}

export interface UseLogStreamReturn<T extends LogStreamItem = LogStreamItem> {
  /** 日志列表 */
  list: Ref<T[]>
  /** 加载状态 */
  loading: Ref<boolean>
  /** 是否还有更多数据 */
  hasMore: Ref<boolean>
  /** 下一页游标 */
  nextCursor: Ref<number | string | null>
  /** 初始加载 */
  loadInitial: () => Promise<void>
  /** 加载更多 */
  loadMore: () => Promise<void>
  /** 重置并重新加载（筛选条件变化时调用） */
  refresh: () => Promise<void>
  /** 追加新条目（SSE 实时推送用） */
  prepend: (item: T) => void
}

export function useLogStream<T extends LogStreamItem = LogStreamItem>(
  options: UseLogStreamOptions<T>
): UseLogStreamReturn<T> {
  const { api, searchForm, pageSize = 20, immediate = false } = options

  const list = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const hasMore = ref(true)
  const nextCursor = ref<number | string | null>(null)

  /** 构建请求参数 */
  const buildParams = () => {
    const params: Record<string, any> = {
      page_size: pageSize,
    }
    if (nextCursor.value) {
      params.cursor = nextCursor.value
    }
    if (searchForm?.value) {
      Object.assign(params, searchForm.value)
    }
    return params
  }

  /** 初始加载 */
  const loadInitial = async () => {
    loading.value = true
    nextCursor.value = null
    try {
      const params = buildParams()
      const res = await api.listCursor(params)
      list.value = res.list
      nextCursor.value = res.next_cursor
      hasMore.value = res.has_more
    } finally {
      loading.value = false
    }
  }

  /** 加载更多 */
  const loadMore = async () => {
    if (loading.value || !hasMore.value) return
    
    loading.value = true
    try {
      const params = buildParams()
      const res = await api.listCursor(params)
      list.value.push(...res.list)
      nextCursor.value = res.next_cursor
      hasMore.value = res.has_more
    } finally {
      loading.value = false
    }
  }

  /** 重置并重新加载 */
  const refresh = async () => {
    list.value = []
    hasMore.value = true
    nextCursor.value = null
    await loadInitial()
  }

  /** 追加新条目到头部（SSE 实时推送） */
  const prepend = (item: T) => {
    list.value.unshift(item)
  }

  // 立即加载
  if (immediate) {
    loadInitial()
  }

  return {
    list,
    loading,
    hasMore,
    nextCursor,
    loadInitial,
    loadMore,
    refresh,
    prepend
  }
}
