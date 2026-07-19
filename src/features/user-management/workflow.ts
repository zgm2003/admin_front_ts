import { shallowRef } from 'vue'
import { UsersListApi } from '@/api/user/users'
import { createMutation, type MutationExecutionOptions } from '@/modules/resource-query/mutation'
import { createResourceQuery } from '@/modules/resource-query/query'
import type { Id } from '@/types/common'
import type {
  UserBatchEditParams,
  UserEditParams,
  UserListItem,
  UserListInitResponse,
  UserListResponse,
  UserExportResponse,
  UsersListParams,
} from '@/types/user'

export interface UserManagementWorkflowApi {
  pageInit(options: { readonly signal: AbortSignal }): Promise<UserListInitResponse>
  list(params: UsersListParams, options: { readonly signal: AbortSignal }): Promise<UserListResponse>
  update(params: UserEditParams, options: MutationExecutionOptions): Promise<void>
  batchEdit(params: UserBatchEditParams, options: MutationExecutionOptions): Promise<void>
  changeStatus(params: { id: Id; status: 1 | 2 }, options: MutationExecutionOptions): Promise<void>
  deleteOne(params: { id: Id }, options: MutationExecutionOptions): Promise<void>
  deleteBatch(params: { ids: Id[] }, options: MutationExecutionOptions): Promise<void>
  export(params: { ids: number[] }, options: MutationExecutionOptions): Promise<UserExportResponse>
}

export interface UserManagementWorkflowOptions {
  readonly api?: UserManagementWorkflowApi
  readonly confirmDelete?: (input: { readonly ids: readonly Id[] }) => Promise<boolean>
  readonly confirmStatus?: (input: { readonly id: Id; readonly status: 1 | 2 }) => Promise<boolean>
}

export function createUserManagementWorkflow(options: UserManagementWorkflowOptions = {}) {
  const api = options.api ?? UsersListApi
  const page = shallowRef({ current_page: 1, page_size: 20, total: 0, total_page: 0 })
  const pageInit = createResourceQuery<UserListInitResponse, undefined, UserListInitResponse>({
    request: (_params, context) => api.pageInit(context),
    selectItems: (result) => [result],
  })
  const list = createResourceQuery<UserListItem, UsersListParams, UserListResponse>({
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
    onCommit(result, params) {
      page.value = result.page
      return {
        ...params,
        current_page: result.page.current_page,
        page_size: result.page.page_size,
      }
    },
  })

  const update = createMutation({
    key: (input: UserEditParams) => `user:update:${input.id}`,
    execute: (input, mutationOptions) => api.update(input, mutationOptions),
    invalidate: [list],
  })
  const batchEdit = createMutation({
    key: (input: UserBatchEditParams) => `user:batch-edit:${input.field}:${input.ids.join(',')}`,
    execute: (input, mutationOptions) => api.batchEdit(input, mutationOptions),
    invalidate: [list],
  })
  const changeStatus = createMutation({
    key: (input: { id: Id; status: 1 | 2 }) => `user:status:${input.id}:${input.status}`,
    confirm: options.confirmStatus,
    execute: (input, mutationOptions) => api.changeStatus(input, mutationOptions),
    invalidate: [list],
  })
  const deleteOne = createMutation({
    key: (input: { id: Id }) => `user:delete:${input.id}`,
    confirm: options.confirmDelete
      ? (input) => options.confirmDelete!({ ids: [input.id] })
      : undefined,
    execute: (input, mutationOptions) => api.deleteOne(input, mutationOptions),
    invalidate: [list],
  })
  const deleteBatch = createMutation({
    key: (input: { ids: Id[] }) => `user:delete-batch:${input.ids.join(',')}`,
    confirm: options.confirmDelete,
    execute: (input, mutationOptions) => api.deleteBatch(input, mutationOptions),
    invalidate: [list],
  })
  const exportUsers = createMutation({
    key: (input: { ids: number[] }) => `user:export:${input.ids.join(',')}`,
    execute: (input, mutationOptions) => api.export(input, mutationOptions),
    invalidate: [],
  })

  function dispose() {
    update.dispose()
    batchEdit.dispose()
    changeStatus.dispose()
    deleteOne.dispose()
    deleteBatch.dispose()
    exportUsers.dispose()
    list.dispose()
    pageInit.dispose()
  }

  return {
    pageInit,
    loadPageInit: () => pageInit.execute(undefined),
    list,
    page,
    update,
    batchEdit,
    changeStatus,
    deleteOne,
    deleteBatch,
    exportUsers,
    dispose,
  }
}
