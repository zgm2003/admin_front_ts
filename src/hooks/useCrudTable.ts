import { getCurrentScope, onScopeDispose } from 'vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import i18n from '@/i18n'
import { isApiError } from '@/modules/http/error'
import { useTable, type PaginationParams, type TableApiModule, type UseTableOptions } from '@/components/Table/src/useTable'
import { createMutation, type MutationExecutionOptions } from '@/modules/resource-query/mutation'
import type { Id, Identifiable } from '@/types/common'

const t = i18n.global.t

interface CrudApiModule<
  T extends Identifiable,
  P extends PaginationParams = PaginationParams,
  S extends number = number,
> extends TableApiModule<T, P> {
  deleteOne?(params: { id: Id }, options?: MutationExecutionOptions): Promise<unknown>
  deleteBatch?(params: { ids: Id[] }, options?: MutationExecutionOptions): Promise<unknown>
  changeStatus?(params: { id: Id; status: S }, options?: MutationExecutionOptions): Promise<unknown>
}

interface UseCrudTableOptions<
  T extends Identifiable,
  P extends PaginationParams = PaginationParams,
  S extends number = number,
> extends UseTableOptions<T, P> {
  api: CrudApiModule<T, P, S>
  afterDel?: () => void
}

async function confirmMutation(message: string, confirmButtonText: string): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, t('common.confirmTitle'), {
      type: 'warning',
      confirmButtonText,
      cancelButtonText: t('common.actions.cancel'),
    })
    return true
  } catch {
    return false
  }
}

function idKey(id: Id): string {
  return JSON.stringify([typeof id, id])
}

export function useCrudTable<
  T extends Identifiable = Identifiable,
  P extends PaginationParams = PaginationParams,
  S extends number = number,
>(options: UseCrudTableOptions<T, P, S>) {
  const { api, afterDel, ...tableOptions } = options
  const table = useTable<T, P>({ api, ...tableOptions })
  const deleteOne = api.deleteOne
  const deleteBatch = api.deleteBatch
  const changeStatus = api.changeStatus

  const deleteOneMutation = deleteOne && createMutation({
    key: (input: { id: Id }) => `delete-one:${idKey(input.id)}`,
    confirm: () => confirmMutation(t('common.confirmDelete'), t('common.actions.del')),
    execute: (input, mutationOptions) => deleteOne(input, mutationOptions),
    invalidate: [table.resource],
  })
  const deleteBatchMutation = deleteBatch && createMutation({
    key: (input: { ids: Id[] }) => `delete-batch:${JSON.stringify(input.ids.map(idKey))}`,
    confirm: () => confirmMutation(t('common.confirmBatchDelete'), t('common.actions.del')),
    execute: (input, mutationOptions) => deleteBatch(input, mutationOptions),
    invalidate: [table.resource],
  })
  const statusMutation = changeStatus && createMutation({
    key: (input: { id: Id; status: S }) => `status:${idKey(input.id)}:${String(input.status)}`,
    confirm: () => confirmMutation(t('common.confirmStatusChange'), t('common.actions.confirm')),
    execute: (input, mutationOptions) => changeStatus(input, mutationOptions),
    invalidate: [table.resource],
  })

  function onSearch() {
    table.resetPage()
    return table.getList()
  }

  async function confirmDel(row: T) {
    if (!deleteOneMutation) {
      console.warn('useCrudTable: api.deleteOne not provided')
      return
    }
    const input = { id: row.id }
    const duplicate = deleteOneMutation.isPending(input)
    let result
    try {
      result = await deleteOneMutation.mutate(input)
    } catch (error) {
      if (isApiError(error) && error.kind === 'canceled') return
      throw error
    }
    if (duplicate || result.kind === 'canceled') return
    ElNotification.success({ message: t('common.success.operation') })
    afterDel?.()
  }

  async function batchDel() {
    if (!deleteBatchMutation) {
      console.warn('useCrudTable: api.deleteBatch not provided')
      return
    }
    if (!table.selectedIds.value.length) {
      ElNotification.error({ message: t('common.selectAtLeastOne') })
      return
    }
    const input = { ids: [...table.selectedIds.value] }
    const duplicate = deleteBatchMutation.isPending(input)
    let result
    try {
      result = await deleteBatchMutation.mutate(input)
    } catch (error) {
      if (isApiError(error) && error.kind === 'canceled') return
      throw error
    }
    if (duplicate || result.kind === 'canceled') return
    table.clearSelection()
    ElNotification.success({ message: t('common.success.operation') })
    afterDel?.()
  }

  async function toggleStatus(row: T, newStatus: S) {
    if (!statusMutation) {
      console.warn('useCrudTable: api.changeStatus not provided')
      return
    }
    const input = { id: row.id, status: newStatus }
    const duplicate = statusMutation.isPending(input)
    let result
    try {
      result = await statusMutation.mutate(input)
    } catch (error) {
      if (isApiError(error) && error.kind === 'canceled') return
      throw error
    }
    if (duplicate || result.kind === 'canceled') return
    ElNotification.success({ message: t('common.success.operation') })
  }

  function dispose() {
    deleteOneMutation?.dispose()
    deleteBatchMutation?.dispose()
    statusMutation?.dispose()
    table.dispose()
  }
  function cancelMutations() {
    deleteOneMutation?.cancel()
    deleteBatchMutation?.cancel()
    statusMutation?.cancel()
  }
  if (getCurrentScope()) onScopeDispose(dispose)

  return {
    ...table,
    onSearch,
    confirmDel,
    batchDel,
    toggleStatus,
    cancelMutations,
    dispose,
  }
}
