import { computed } from 'vue'
import {
  ExportTaskApi,
  type ExportTaskItem,
  type ExportTaskListParams,
  type ExportTaskListResponse,
  type ExportTaskStatusItem,
} from '@/api/system/exportTask'
import { createMutation, type MutationExecutionOptions } from '@/modules/resource-query/mutation'
import { createResourceQuery } from '@/modules/resource-query/query'
import type { Id } from '@/types/common'

type StatusParams = Pick<ExportTaskListParams, 'kind' | 'title' | 'file_name'>

export interface ExportsWorkflowApi {
  list(params: ExportTaskListParams, options: { readonly signal: AbortSignal }): Promise<ExportTaskListResponse>
  statusCount(params: StatusParams, options: { readonly signal: AbortSignal }): Promise<ExportTaskStatusItem[]>
  deleteOne(params: { id: Id }, options: MutationExecutionOptions): Promise<void>
  deleteBatch(params: { ids: Id[] }, options: MutationExecutionOptions): Promise<void>
}

export interface ExportsWorkflowOptions {
  readonly api?: ExportsWorkflowApi
  readonly confirmDelete?: (ids: readonly Id[]) => Promise<boolean>
}

export function createExportsWorkflow(options: ExportsWorkflowOptions = {}) {
  const api = options.api ?? ExportTaskApi
  const list = createResourceQuery<ExportTaskItem, ExportTaskListParams, ExportTaskListResponse>({
    async request(params, context) {
      let result = await api.list(params, context)
      if (!context.signal.aborted && result.list.length === 0 && result.page.current_page > 1) {
        result = await api.list({
          ...params,
          current_page: result.page.current_page - 1,
          page_size: result.page.page_size,
        }, context)
      }
      return result
    },
    selectItems: (result) => result.list,
    onCommit: (result, params) => ({
      ...params,
      current_page: result.page.current_page,
      page_size: result.page.page_size,
    }),
  })
  const statuses = createResourceQuery<ExportTaskStatusItem, StatusParams, ExportTaskStatusItem[]>({
    request: (params, context) => api.statusCount(params, context),
    selectItems: (result) => result,
  })
  const statusCounts = computed(() => [...statuses.state.value.data])

  const deleteOne = createMutation({
    key: (input: { id: Id }) => `export:delete:${input.id}`,
    confirm: options.confirmDelete
      ? (input) => options.confirmDelete!([input.id])
      : undefined,
    execute: (input, mutationOptions) => api.deleteOne(input, mutationOptions),
    invalidate: [list],
  })
  const deleteBatch = createMutation({
    key: (input: { ids: Id[] }) => `export:delete-batch:${input.ids.join(',')}`,
    confirm: options.confirmDelete
      ? (input) => options.confirmDelete!(input.ids)
      : undefined,
    execute: (input, mutationOptions) => api.deleteBatch(input, mutationOptions),
    invalidate: [list],
  })

  function loadStatusCounts(params: StatusParams) {
    return statuses.execute(params)
  }

  function dispose() {
    deleteOne.dispose()
    deleteBatch.dispose()
    statuses.dispose()
    list.dispose()
  }

  return { list, statuses, statusCounts, loadStatusCounts, deleteOne, deleteBatch, dispose }
}
