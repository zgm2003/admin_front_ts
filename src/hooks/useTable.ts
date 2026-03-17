import { ref, type MaybeRef, unref } from 'vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import i18n from '@/i18n'
import type { Id, Identifiable, PaginatedResponse, RequestPayload } from '@/types/common'

const t = i18n.global.t

export interface PageState {
  current_page: number
  page_size: number
  total: number
  total_page?: number
}

type PaginationParams = Pick<PageState, 'current_page' | 'page_size'>
type ListRequest<P extends RequestPayload> = PaginationParams & Partial<Omit<P, keyof PaginationParams>>

interface ApiModule<
  T extends Identifiable,
  P extends PaginationParams & RequestPayload = PaginationParams & RequestPayload,
> {
  list(params: ListRequest<P>): Promise<PaginatedResponse<T>>
  del?(params: { id: Id | Id[] }): Promise<unknown>
  status?(params: { id: Id; status: number }): Promise<unknown>
}

interface UseTableOptions<
  T extends Identifiable,
  P extends PaginationParams & RequestPayload = PaginationParams & RequestPayload,
> {
  api: ApiModule<T, P>
  searchForm?: MaybeRef<Partial<Omit<P, keyof PaginationParams>>>
  immediate?: boolean
  initPage?: Partial<PageState>
  dataCallback?: (data: PaginatedResponse<T>) => PaginatedResponse<T>
  afterDel?: () => void
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
    afterDel,
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

  const onSelectionChange = (selection: T[]) => {
    selectedIds.value = selection.map((item) => item.id)
  }

  const getList = () => {
    loading.value = true

    const params = {
      ...(unref(searchForm) ?? {}),
      page_size: page.value.page_size,
      current_page: page.value.current_page,
    } as ListRequest<P>

    return api
      .list(params)
      .then((response) => {
        const result = dataCallback ? dataCallback(response) : response
        data.value = result.list
        page.value = result.page
        return result
      })
      .finally(() => {
        loading.value = false
      })
  }

  const onSearch = () => {
    page.value.current_page = 1
    void getList()
  }

  const onPageChange = (nextPage: PageState) => {
    page.value = nextPage
    void getList()
  }

  const refresh = () => {
    void getList()
  }

  const confirmDel = async (row: T) => {
    if (!api.del) {
      console.warn('useTable: api.del not provided')
      return
    }

    try {
      await ElMessageBox.confirm(t('common.confirmDelete'), t('common.confirmTitle'), {
        type: 'warning',
        confirmButtonText: t('common.actions.del'),
        cancelButtonText: t('common.actions.cancel'),
      })
    } catch {
      return
    }

    await api.del({ id: row.id })
    ElNotification.success({ message: t('common.success.operation') })
    void getList()
    afterDel?.()
  }

  const batchDel = async () => {
    if (!api.del) {
      console.warn('useTable: api.del not provided')
      return
    }

    if (!selectedIds.value.length) {
      ElNotification.error({ message: t('common.selectAtLeastOne') })
      return
    }

    try {
      await ElMessageBox.confirm(t('common.confirmBatchDelete'), t('common.confirmTitle'), {
        type: 'warning',
        confirmButtonText: t('common.actions.del'),
        cancelButtonText: t('common.actions.cancel'),
      })
    } catch {
      return
    }

    await api.del({ id: selectedIds.value })
    ElNotification.success({ message: t('common.success.operation') })
    selectedIds.value = []
    void getList()
    afterDel?.()
  }

  const toggleStatus = async (row: T, newStatus: number) => {
    if (!api.status) {
      console.warn('useTable: api.status not provided')
      return
    }

    try {
      await ElMessageBox.confirm(t('common.confirmStatusChange'), t('common.confirmTitle'), {
        type: 'warning',
        confirmButtonText: t('common.actions.confirm'),
        cancelButtonText: t('common.actions.cancel'),
      })
    } catch {
      return
    }

    await api.status({ id: row.id, status: newStatus })
    ElNotification.success({ message: t('common.success.operation') })
    void getList()
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
    onSearch,
    onPageChange,
    onSelectionChange,
    refresh,
    confirmDel,
    batchDel,
    toggleStatus,
  }
}
