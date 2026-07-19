import {
  computed,
  ref,
  unref,
  watch,
  type MaybeRef,
} from 'vue'
import type { ResourceQuery } from '@/modules/resource-query/types'
import type { Identifiable } from '@/types/common'

export interface WorkflowPageState {
  readonly current_page: number
  readonly page_size: number
  readonly total: number
  readonly total_page?: number
}

type PaginationParams = Pick<WorkflowPageState, 'current_page' | 'page_size'>
type SearchParams<TParams extends PaginationParams> = Partial<Omit<TParams, keyof PaginationParams>>

export interface WorkflowTableOptions<
  TItem extends Identifiable,
  TParams extends PaginationParams,
  TPage,
> {
  readonly resource: ResourceQuery<TItem, TParams, TPage>
  readonly page: MaybeRef<WorkflowPageState>
  readonly searchForm?: MaybeRef<SearchParams<TParams>>
}

export function useWorkflowTable<
  TItem extends Identifiable,
  TParams extends PaginationParams,
  TPage = unknown,
>(options: WorkflowTableOptions<TItem, TParams, TPage>) {
  const selectedIds = ref<Array<TItem['id']>>([])
  const page = computed(() => unref(options.page))
  const data = computed<TItem[]>(() => [...options.resource.state.value.data])
  const loading = computed(() => {
    const kind = options.resource.state.value.kind
    return kind === 'loading' || kind === 'refreshing'
  })

  function paramsFor(pagination: PaginationParams): TParams {
    return {
      ...(unref(options.searchForm) ?? {}),
      current_page: pagination.current_page,
      page_size: pagination.page_size,
    } as TParams
  }

  function getList(pagination: PaginationParams = page.value) {
    return options.resource.execute(paramsFor(pagination))
  }

  function onSearch() {
    return getList({ current_page: 1, page_size: page.value.page_size })
  }

  function onPageChange(nextPage: WorkflowPageState) {
    const pageSizeChanged = nextPage.page_size !== page.value.page_size
    return getList({
      current_page: pageSizeChanged ? 1 : nextPage.current_page,
      page_size: nextPage.page_size,
    })
  }

  function refresh() {
    return options.resource.state.value.kind === 'idle'
      ? getList()
      : options.resource.refresh()
  }

  function onSelectionChange(selection: TItem[]) {
    selectedIds.value = selection.map(({ id }) => id)
  }

  function clearSelection() {
    selectedIds.value = []
  }

  watch(data, (items) => {
    const available = new Set(items.map(({ id }) => id))
    selectedIds.value = selectedIds.value.filter((id) => available.has(id))
  }, { flush: 'sync' })

  return {
    state: options.resource.state,
    data,
    loading,
    page,
    selectedIds,
    getList,
    onSearch,
    onPageChange,
    refresh,
    retry: () => options.resource.retry(),
    onSelectionChange,
    clearSelection,
  }
}
