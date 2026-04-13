import { ElMessageBox, ElNotification } from 'element-plus'
import i18n from '@/i18n'
import { useTable, type PageState, type TableApiModule, type UseTableOptions } from '@/components/Table/src/useTable'
import type { Id, Identifiable, RequestPayload } from '@/types/common'

const t = i18n.global.t

interface CrudApiModule<
  T extends Identifiable,
  P extends Pick<PageState, 'current_page' | 'page_size'> & RequestPayload = Pick<PageState, 'current_page' | 'page_size'> & RequestPayload,
> extends TableApiModule<T, P> {
  del?(params: { id: Id | Id[] }): Promise<unknown>
  status?(params: { id: Id; status: number }): Promise<unknown>
}

interface UseCrudTableOptions<
  T extends Identifiable,
  P extends Pick<PageState, 'current_page' | 'page_size'> & RequestPayload = Pick<PageState, 'current_page' | 'page_size'> & RequestPayload,
> extends UseTableOptions<T, P> {
  api: CrudApiModule<T, P>
  afterDel?: () => void
}

export function useCrudTable<
  T extends Identifiable = Identifiable,
  P extends Pick<PageState, 'current_page' | 'page_size'> & RequestPayload = Pick<PageState, 'current_page' | 'page_size'> & RequestPayload,
>(options: UseCrudTableOptions<T, P>) {
  const { api, afterDel, ...tableOptions } = options

  const table = useTable<T, P>({
    api,
    ...tableOptions,
  })

  function onSearch() {
    table.resetPage()
    void table.getList()
  }

  async function confirmDel(row: T) {
    if (!api.del) {
      console.warn('useCrudTable: api.del not provided')
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
    await table.getList()
    afterDel?.()
  }

  async function batchDel() {
    if (!api.del) {
      console.warn('useCrudTable: api.del not provided')
      return
    }

    if (!table.selectedIds.value.length) {
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

    await api.del({ id: table.selectedIds.value })
    ElNotification.success({ message: t('common.success.operation') })
    table.clearSelection()
    await table.getList()
    afterDel?.()
  }

  async function toggleStatus(row: T, newStatus: number) {
    if (!api.status) {
      console.warn('useCrudTable: api.status not provided')
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
    await table.getList()
  }

  return {
    ...table,
    onSearch,
    confirmDel,
    batchDel,
    toggleStatus,
  }
}
