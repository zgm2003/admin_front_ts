import { computed, ref, type MaybeRef, unref } from 'vue'
import { useResourceQuery } from '@/modules/resource-query/vue'
import type { Identifiable, PaginatedResponse } from '@/types/common'

export interface PageState {
  current_page: number
  page_size: number
  total: number
  total_page?: number
}

export type PaginationParams = Pick<PageState, 'current_page' | 'page_size'>
type SearchParams<P extends PaginationParams> = Partial<Omit<P, keyof PaginationParams>>
type ListRequest<P extends PaginationParams> = PaginationParams & SearchParams<P>

export interface TableApiModule<
  T extends Identifiable,
  P extends PaginationParams = PaginationParams,
> {
  list(
    params: ListRequest<P>,
    options?: { readonly signal: AbortSignal },
  ): Promise<PaginatedResponse<T>>
}

export interface UseTableOptions<
  T extends Identifiable,
  P extends PaginationParams = PaginationParams,
> {
  api: TableApiModule<T, P>
  searchForm?: MaybeRef<SearchParams<P>>
  immediate?: boolean
  initPage?: Partial<PageState>
  dataCallback?: (data: PaginatedResponse<T>) => PaginatedResponse<T>
}

export function useTable<
  T extends Identifiable = Identifiable,
  P extends PaginationParams = PaginationParams,
>(options: UseTableOptions<T, P>) {
  const {
    api,
    searchForm = {},
    immediate = false,
    initPage = {},
    dataCallback,
  } = options

  const page = ref<PageState>({
    current_page: 1,
    page_size: 20,
    total: 0,
    ...initPage,
  })
  const selectedIds = ref<Array<T['id']>>([])
  const requestParams = computed<ListRequest<P>>(() => ({
    ...(unref(searchForm) ?? {}),
    page_size: page.value.page_size,
    current_page: page.value.current_page,
  }) as ListRequest<P>)

  const query = useResourceQuery<T, ListRequest<P>, PaginatedResponse<T>>({
    async request(params, context) {
      let effectiveParams = { ...params }
      let response = await api.list(effectiveParams, context)
      let result = dataCallback ? dataCallback(response) : response
      if (result.list.length === 0 && result.page.current_page > 1) {
        effectiveParams = {
          ...effectiveParams,
          current_page: result.page.current_page - 1,
          page_size: result.page.page_size,
        }
        response = await api.list(effectiveParams, context)
        result = dataCallback ? dataCallback(response) : response
      }
      return result
    },
    selectItems: (result) => result.list,
    onCommit(result, params) {
      page.value = result.page
      const availableIds = new Set(result.list.map((item) => item.id))
      selectedIds.value = selectedIds.value.filter((id) => availableIds.has(id))
      return {
        ...params,
        current_page: result.page.current_page,
        page_size: result.page.page_size,
      }
    },
  })

  const loading = computed(() => query.state.value.kind === 'loading'
    || query.state.value.kind === 'refreshing')
  const data = computed<T[]>(() => [...query.state.value.data])

  function onSelectionChange(selection: T[]) {
    selectedIds.value = selection.map((item) => item.id)
  }

  function getList() {
    return query.execute({ ...requestParams.value })
  }

  function onPageChange(nextPage: PageState) {
    const pageSizeChanged = nextPage.page_size !== page.value.page_size
    page.value = {
      ...nextPage,
      current_page: pageSizeChanged ? 1 : nextPage.current_page,
    }
    return getList()
  }

  function refresh() {
    return query.state.value.kind === 'idle' ? getList() : query.refresh()
  }

  function retry() {
    return query.retry()
  }

  function resetPage() {
    page.value = { ...page.value, current_page: 1 }
  }

  function reset() {
    query.reset()
    resetPage()
    selectedIds.value = []
  }

  function clearSelection() {
    selectedIds.value = []
  }

  if (immediate) void getList().catch(() => undefined)

  return {
    resource: query,
    state: query.state,
    loading,
    data,
    page,
    selectedIds,
    getList,
    onPageChange,
    onSelectionChange,
    refresh,
    retry,
    reset,
    resetPage,
    clearSelection,
    dispose: () => query.dispose(),
  }
}
