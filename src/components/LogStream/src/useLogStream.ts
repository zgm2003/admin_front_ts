import { ref, type Ref } from 'vue'
import type { LogStreamApi, LogStreamItem } from '../types'

export interface UseLogStreamOptions<T extends LogStreamItem = LogStreamItem> {
  api: LogStreamApi<T>
  searchForm?: Ref<Record<string, unknown>>
  pageSize?: number
  /** Load immediately during setup. */
  immediate?: boolean
}

export interface UseLogStreamReturn<T extends LogStreamItem = LogStreamItem> {
  /** Stream items in render order. */
  list: Ref<T[]>
  /** Loading state for initial fetch and pagination. */
  loading: Ref<boolean>
  /** Whether the backend still has more data. */
  hasMore: Ref<boolean>
  /** Cursor for the next paginated request. */
  nextCursor: Ref<number | string | null>
  /** Reset cursor and fetch the first page. */
  loadInitial: () => Promise<void>
  /** Fetch the next page and append it to the stream. */
  loadMore: () => Promise<void>
  /** Clear current items and reload from page one. */
  refresh: () => Promise<void>
  /** Insert a newer item at the top of the stream. */
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

  /** Build request params from pagination and current filters. */
  const buildParams = () => {
    const params: Record<string, unknown> = {
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

  /** Fetch the first page. */
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

  /** Fetch the next page. */
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

  /** Reload from scratch after filters change. */
  const refresh = async () => {
    list.value = []
    hasMore.value = true
    nextCursor.value = null
    await loadInitial()
  }

  /** Prepend a newly pushed record, for example from SSE. */
  const prepend = (item: T) => {
    list.value.unshift(item)
  }

  // Support components that want setup-time loading.
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
    prepend,
  }
}
