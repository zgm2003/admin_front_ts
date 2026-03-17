import { ref, type MaybeRef, type Ref, unref } from 'vue'
import type { RequestPayload } from '@/types/common'
import type { LogStreamApi, LogStreamItem } from '../types'

type CursorPaginationParams = {
  cursor?: number | string
  page_size: number
}

type CursorRequest<P extends RequestPayload> =
  CursorPaginationParams & Partial<Omit<P, keyof CursorPaginationParams>>

export interface UseLogStreamOptions<
  T extends LogStreamItem = LogStreamItem,
  P extends CursorPaginationParams & RequestPayload = CursorPaginationParams & RequestPayload,
> {
  api: LogStreamApi<T, P>
  searchForm?: MaybeRef<Partial<Omit<P, keyof CursorPaginationParams>>>
  pageSize?: number
  immediate?: boolean
}

export interface UseLogStreamReturn<T extends LogStreamItem = LogStreamItem> {
  list: Ref<T[]>
  loading: Ref<boolean>
  hasMore: Ref<boolean>
  nextCursor: Ref<number | string | null>
  loadInitial: () => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  prepend: (item: T) => void
}

export function useLogStream<
  T extends LogStreamItem = LogStreamItem,
  P extends CursorPaginationParams & RequestPayload = CursorPaginationParams & RequestPayload,
>(
  options: UseLogStreamOptions<T, P>
): UseLogStreamReturn<T> {
  const { api, searchForm, pageSize = 20, immediate = false } = options

  const list = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const hasMore = ref(true)
  const nextCursor = ref<number | string | null>(null)

  const buildParams = () => {
    const params = {
      page_size: pageSize,
    } as CursorRequest<P>

    if (nextCursor.value) {
      params.cursor = nextCursor.value
    }

    const filters = unref(searchForm)
    if (filters) {
      Object.assign(params, filters)
    }

    return params
  }

  const loadInitial = async () => {
    loading.value = true
    nextCursor.value = null

    try {
      const response = await api.listCursor(buildParams())
      list.value = response.list
      nextCursor.value = response.next_cursor
      hasMore.value = response.has_more
    } finally {
      loading.value = false
    }
  }

  const loadMore = async () => {
    if (loading.value || !hasMore.value) {
      return
    }

    loading.value = true

    try {
      const response = await api.listCursor(buildParams())
      list.value.push(...response.list)
      nextCursor.value = response.next_cursor
      hasMore.value = response.has_more
    } finally {
      loading.value = false
    }
  }

  const refresh = async () => {
    list.value = []
    hasMore.value = true
    nextCursor.value = null
    await loadInitial()
  }

  const prepend = (item: T) => {
    list.value.unshift(item)
  }

  if (immediate) {
    void loadInitial()
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
