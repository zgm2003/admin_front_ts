import { ref, reactive, toRefs } from 'vue'

interface PageState {
  current_page: number
  page_size: number
  total: number
}

interface UseTableOptions<T> {
  // API 请求函数，接收 params，返回 Promise
  api: (params: any) => Promise<{ list: T[]; page: PageState }>
  // 搜索表单（响应式对象）
  searchForm?: any
  // 是否立即请求
  immediate?: boolean
  // 分页初始值
  initPage?: Partial<PageState>
  // 数据处理回调
  dataCallback?: (data: any) => any
}

export function useTable<T = any>(options: UseTableOptions<T>) {
  const { api, searchForm = {}, immediate = true, initPage = {}, dataCallback } = options

  const loading = ref(false)
  const data = ref<T[]>([])
  const page = ref<PageState>({
    current_page: 1,
    page_size: 20,
    total: 0,
    ...initPage
  })

  // 获取列表
  const getList = () => {
    loading.value = true
    // 合并搜索参数和分页参数
    const params = {
      ...searchForm.value, // 假设传入的是 ref
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
        const list = res.list || res || []
        const pageRes = res.page || { total: 0 }

        data.value = list
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

  // 立即执行
  if (immediate) {
    getList()
  }

  return {
    loading,
    data,
    page,
    getList,
    onSearch,
    onPageChange,
    refresh
  }
}
