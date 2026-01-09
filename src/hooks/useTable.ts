import {ref, unref} from 'vue'
import {ElNotification, ElMessageBox} from 'element-plus'
import i18n from '@/i18n'

const t = i18n.global.t

interface PageState {
  current_page: number
  page_size: number
  total: number
}

interface UseTableOptions<T> {
  // API 请求函数，接收 params，返回 Promise
  api: (params: any) => Promise<{ list: T[]; page: PageState }>
  // 搜索表单（响应式对象，支持 ref 或 reactive）
  searchForm?: any
  // 是否立即请求（默认 false，遵循最小惊讶原则）
  immediate?: boolean
  // 分页初始值
  initPage?: Partial<PageState>
  // 数据处理回调
  dataCallback?: (data: any) => any
  // 删除 API
  delApi?: (params: any) => Promise<any>
  // 删除后回调
  afterDel?: () => void
}

export function useTable<T = any>(options: UseTableOptions<T>) {
  const { api, searchForm = {}, immediate = false, initPage = {}, dataCallback, delApi, afterDel } = options

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
    // 合并搜索参数和分页参数，使用 unref 兼容 ref/reactive
    const params = {
      ...unref(searchForm),
      page_size: page.value.page_size,
      current_page: page.value.current_page
    }

    return api(params)
      .then((res: any) => {
        // 允许外部处理数据
        if (dataCallback) {
          res = dataCallback(res)
        }
        
        // 兼容不同的后端返回结构，这里假设标准结构是 { list, page }
        // 如果后端直接返回数组，需要适配
        data.value = res.list || res || []
        if (res.page) {
            page.value = res.page
        } else {
             // 如果没有 page 字段，可能是不分页接口，或者结构不同
             // 这里保留原 page 对象，只更新 total（如果有）
             if (res.total !== undefined) page.value.total = res.total
        }
        
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
    if (!delApi) {
      console.warn('useTable: delApi not provided')
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
    await delApi({ id: row.id })
    ElNotification.success({ message: t('common.success.operation') })
    getList()
    afterDel?.()
  }

  // 批量删除
  const batchDel = async () => {
    if (!delApi) {
      console.warn('useTable: delApi not provided')
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
    await delApi({ id: selectedIds.value })
    ElNotification.success({ message: t('common.success.operation') })
    selectedIds.value = []
    getList()
    afterDel?.()
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
    batchDel
  }
}
