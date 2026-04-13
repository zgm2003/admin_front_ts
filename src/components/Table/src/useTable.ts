import { computed, ref, type MaybeRef, unref } from 'vue'
import type { Identifiable, PaginatedResponse, RequestPayload } from '@/types/common'

export interface PageState {
  current_page: number
  page_size: number
  total: number
  total_page?: number
}

type PaginationParams = Pick<PageState, 'current_page' | 'page_size'>
type ListRequest<P extends RequestPayload> = PaginationParams & Partial<Omit<P, keyof PaginationParams>>

export interface TableApiModule<
  T extends Identifiable,
  P extends PaginationParams & RequestPayload = PaginationParams & RequestPayload,
> {
  list(params: ListRequest<P>): Promise<PaginatedResponse<T>>
}

export interface UseTableOptions<
  T extends Identifiable,
  P extends PaginationParams & RequestPayload = PaginationParams & RequestPayload,
> {
  api: TableApiModule<T, P>
  searchForm?: MaybeRef<Partial<Omit<P, keyof PaginationParams>>>
  immediate?: boolean
  initPage?: Partial<PageState>
  dataCallback?: (data: PaginatedResponse<T>) => PaginatedResponse<T>
}

export function useTable<
  T extends Identifiable = Identifiable,
  P extends PaginationParams & RequestPayload = PaginationParams & RequestPayload,
>(options: UseTableOptions<T, P>) {
  const {
    api,
    searchForm = {},
    immediate = false,
    initPage = {},
    dataCallback,
  } = options

  const loading = ref(false)
  const data = ref<T[]>([])
  const page = ref<PageState>({
    current_page: 1,
    page_size: 20,
    total: 0,
    ...initPage,
  })

  const selectedIds = ref<Array<T['id']>>([])

  const requestParams = computed(() => ({
    ...(unref(searchForm) ?? {}),
    page_size: page.value.page_size,
    current_page: page.value.current_page,
  }) as ListRequest<P>)

  function onSelectionChange(selection: T[]) {
    selectedIds.value = selection.map((item) => item.id)
  }

  async function getList() {
    loading.value = true

    try {
      const response = await api.list(requestParams.value)
      const result = dataCallback ? dataCallback(response) : response
      data.value = result.list
      page.value = result.page
      return result
    } finally {
      loading.value = false
    }
  }

  function onPageChange(nextPage: PageState) {
    page.value = nextPage
    void getList()
  }

  function refresh() {
    void getList()
  }

  function resetPage() {
    page.value = {
      ...page.value,
      current_page: 1,
    }
  }

  function clearSelection() {
    selectedIds.value = []
  }

  if (immediate) {
    void getList()
  }

  return {
    loading,
    data,
    page,
    selectedIds,
    getList,
    onPageChange,
    onSelectionChange,
    refresh,
    resetPage,
    clearSelection,
  }
}
