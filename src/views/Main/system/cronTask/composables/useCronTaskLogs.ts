import { useTable } from '@/components/Table'
import { CronTaskApi, type CronTaskLogItem, type CronTaskLogListParams } from '@/api/system/cronTask'
import type { PaginatedResponse } from '@/types/common'
import type { Ref } from 'vue'

type LogSearchParams = {
  task_id: number
  date: string[]
}

type LogTableParams = {
  current_page: number
  page_size: number
  task_id?: number
  date?: string[]
}

type CronTaskLogPageParams = CronTaskLogListParams & {
  date?: string[]
}

function toLogQuery(params: LogTableParams): CronTaskLogListParams {
  const [startDate, endDate] = params.date ?? []

  return {
    current_page: params.current_page,
    page_size: params.page_size,
    task_id: Number(params.task_id ?? 0),
    start_date: startDate,
    end_date: endDate,
  }
}

const cronTaskLogTableApi = {
  list: (params: CronTaskLogPageParams): Promise<PaginatedResponse<CronTaskLogItem>> => CronTaskApi.logs(toLogQuery(params)),
}

export function useCronTaskLogs(searchForm: Ref<LogSearchParams>) {
  const table = useTable<CronTaskLogItem, CronTaskLogPageParams>({
    api: cronTaskLogTableApi,
    searchForm,
  })

  function onSearch() {
    table.resetPage()
    void table.getList()
  }

  return {
    ...table,
    onSearch,
  }
}
