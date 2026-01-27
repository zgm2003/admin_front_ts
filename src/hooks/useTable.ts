import {ref, unref} from 'vue'
import {ElNotification, ElMessageBox} from 'element-plus'
import i18n from '@/i18n'

const t = i18n.global.t

interface PageState {
  current_page: number
  page_size: number
  total: number
}

// API 模块标准结构
interface ApiModule {
  list: (params: any) => Promise<{ list: any[]; page: PageState }>
  del?: (params: any) => Promise<any>
  status?: (params: any) => Promise<any>
}

interface UseTableOptions {
  // API 模块（包含 list、del 等方法）
  api: ApiModule
  // 搜索表单（响应式对象，支持 ref 或 reactive）
  searchForm?: any
  // 是否立即请求（默认 false）
  immediate?: boolean
  // 分页初始值
  initPage?: Partial<PageState>
  // 数据处理回调
  dataCallback?: (data: any) => any
  // 删除后回调
  afterDel?: () => void
}

export function useTable<T = any>(options: UseTableOptions) {
  const { api, searchForm = {}, immediate = false, initPage = {}, dataCallback, afterDel } = options

  const loading = ref(false)
  const data = ref<T[]>([])
  const page = ref<PageState>({
    current_page: 1,
    page_size: 20,
    total: 0,
    ...initPage
  })

  // 选中的 ID 列表
  const selectedIds = ref<any[]>([])
  const onSelectionChange = (selection: any[]) => {
    selectedIds.value = selection.map((item: any) => item.id)
  }

  // 获取列表
  const getList = () => {
    loading.value = true
    const params = {
      ...unref(searchForm),
      page_size: page.value.page_size,
      current_page: page.value.current_page
    }

    return api.list(params)
      .then((res: { list: T[]; page: PageState }) => {
        // 允许外部处理数据
        if (dataCallback) {
          res = dataCallback(res)
        }
        // 严格标准结构：{ list, page }
        data.value = res.list
        page.value = res.page
        return res
      })
      .finally(() => {
        loading.value = false
      })
  }

  // 搜索（重置页码）
  const onSearch = () => {
    page.value.current_page = 1
    getList()
  }

  // 分页变化
  const onPageChange = (p: PageState) => {
    page.value = p
    getList()
  }

  // 刷新
  const refresh = () => {
    getList()
  }

  // 单个删除
  const confirmDel = async (row: any) => {
    if (!api.del) {
      console.warn('useTable: api.del not provided')
      return
    }
    try {
      await ElMessageBox.confirm(
        t('common.confirmDelete'),
        t('common.confirmTitle'),
        { type: 'warning', confirmButtonText: t('common.actions.del'), cancelButtonText: t('common.actions.cancel') }
      )
    } catch {
      return
    }
    await api.del({ id: row.id })
    ElNotification.success({ message: t('common.success.operation') })
    getList()
    afterDel?.()
  }

  // 批量删除
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
      await ElMessageBox.confirm(
        t('common.confirmBatchDelete'),
        t('common.confirmTitle'),
        { type: 'warning', confirmButtonText: t('common.actions.del'), cancelButtonText: t('common.actions.cancel') }
      )
    } catch {
      return
    }
    await api.del({ id: selectedIds.value })
    ElNotification.success({ message: t('common.success.operation') })
    selectedIds.value = []
    getList()
    afterDel?.()
  }

  // 状态切换
  const toggleStatus = async (row: any, newStatus: number) => {
    if (!api.status) {
      console.warn('useTable: api.status not provided')
      return
    }
    try {
      await ElMessageBox.confirm(
        t('common.confirmStatusChange'),
        t('common.confirmTitle'),
        { type: 'warning', confirmButtonText: t('common.actions.confirm'), cancelButtonText: t('common.actions.cancel') }
      )
    } catch {
      return
    }
    await api.status({ id: row.id, status: newStatus })
    ElNotification.success({ message: t('common.success.operation') })
    getList()
  }

  // 立即执行
  if (immediate) {
    getList()
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
    toggleStatus
  }
}
