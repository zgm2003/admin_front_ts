import { onBeforeUnmount, ref, shallowRef, watch, type ComputedRef, type MaybeRef } from 'vue'
import { useCrudTable } from '@/hooks/useCrudTable'
import { isApiError } from '@/modules/http/error'
import {
  MailApi,
  type MailLogItem,
  type MailLogListParams,
} from '@/api/system/mail'
import { createDefaultMailDict, normalizeMailDict } from '../mailDict'

type MailLogFilters = Partial<Omit<MailLogListParams, 'current_page' | 'page_size'>>

export function useMailLogDiagnostics(options: {
  canViewLogs: ComputedRef<boolean>
  searchForm: MaybeRef<MailLogFilters>
}) {
  const detailLoading = shallowRef(false)
  const detailVisible = shallowRef(false)
  const detail = ref<MailLogItem | null>(null)
  const dict = ref(createDefaultMailDict())
  let generation = 0
  let active = false
  let activationController: AbortController | null = null
  let activationPromise: Promise<void> | null = null
  let detailController: AbortController | null = null

  function isCurrent(requestGeneration: number) {
    return active && requestGeneration === generation && options.canViewLogs.value
  }

  function isCancellation(error: unknown, controller?: AbortController | null) {
    if (isApiError(error)) return error.kind === 'canceled'
    return controller?.signal.aborted === true
      && error instanceof DOMException
      && error.name === 'AbortError'
  }

  function linkAbortSignals(...signals: AbortSignal[]) {
    const controller = new AbortController()
    const listeners = signals.map((source) => {
      const abort = () => controller.abort(source.reason)
      if (source.aborted) abort()
      else source.addEventListener('abort', abort, { once: true })
      return { source, abort }
    })
    return {
      signal: controller.signal,
      cleanup: () => listeners.forEach(({ source, abort }) => source.removeEventListener('abort', abort)),
    }
  }

  const table = useCrudTable<MailLogItem, MailLogListParams>({
    api: {
      async list(params, requestOptions) {
        if (!active || !options.canViewLogs.value || !requestOptions) {
          throw new DOMException('Mail diagnostics are inactive', 'AbortError')
        }
        const requestGeneration = generation
        const linked = activationController
          ? linkAbortSignals(requestOptions.signal, activationController.signal)
          : null
        const signal = linked?.signal ?? requestOptions.signal
        try {
          const result = await MailApi.logs(params, { signal })
          if (!isCurrent(requestGeneration) || signal.aborted) {
            throw new DOMException('Mail diagnostics request is stale', 'AbortError')
          }
          return result
        } finally {
          linked?.cleanup()
        }
      },
      deleteOne: MailApi.deleteLogs,
      deleteBatch: ({ ids }: { ids: number[] }, requestOptions) => MailApi.deleteLogs({ id: ids }, requestOptions),
    },
    searchForm: options.searchForm,
    immediate: false,
  })

  function clearDetail() {
    detailController?.abort(new DOMException('Mail diagnostic detail cleared', 'AbortError'))
    detailController = null
    detailVisible.value = false
    detailLoading.value = false
    detail.value = null
  }

  function clearDiagnostics() {
    generation++
    active = false
    activationController?.abort(new DOMException('Mail diagnostics cleared', 'AbortError'))
    activationController = null
    activationPromise = null
    clearDetail()
    table.cancelMutations()
    table.reset()
    table.page.value = { current_page: 1, page_size: 20, total: 0 }
    table.selectedIds.value = []
    dict.value = createDefaultMailDict()
  }

  async function activate() {
    if (!options.canViewLogs.value) {
      clearDiagnostics()
      return
    }
    if (activationPromise) return activationPromise

    clearDiagnostics()
    active = true
    const requestGeneration = generation
    const controller = new AbortController()
    activationController = controller
    const promise = (async () => {
      try {
        const initData = await MailApi.pageInit({ signal: controller.signal })
        if (!isCurrent(requestGeneration) || controller.signal.aborted) return
        dict.value = normalizeMailDict(initData.dict)
        await table.getList()
      } catch (error) {
        if (isCancellation(error, controller)) return
        throw error
      } finally {
        if (activationController === controller) {
          activationController = null
          activationPromise = null
        }
      }
    })()
    activationPromise = promise
    return promise
  }

  async function refreshLogs() {
    if (!active || !options.canViewLogs.value) return
    try {
      await table.getList()
    } catch (error) {
      if (isCancellation(error)) return
      throw error
    }
  }

  async function openDetail(row: MailLogItem) {
    if (!active || !options.canViewLogs.value) return
    detailController?.abort(new DOMException('Mail diagnostic detail superseded', 'AbortError'))
    const controller = new AbortController()
    const requestGeneration = generation
    detailController = controller
    detailVisible.value = true
    detailLoading.value = true
    detail.value = null
    try {
      const result = await MailApi.log(row.id, { signal: controller.signal })
      if (detailController === controller && isCurrent(requestGeneration) && !controller.signal.aborted) {
        detail.value = result
      }
    } catch (error) {
      if (isCancellation(error, controller)) return
      throw error
    } finally {
      if (detailController === controller) {
        detailController = null
        if (isCurrent(requestGeneration)) detailLoading.value = false
      }
    }
  }

  watch(options.canViewLogs, (allowed) => {
    if (!allowed) clearDiagnostics()
  }, { flush: 'sync' })
  onBeforeUnmount(clearDiagnostics)

  return {
    ...table,
    dict,
    detail,
    detailLoading,
    detailVisible,
    isActive: () => active && options.canViewLogs.value,
    activate,
    clearDetail,
    clearDiagnostics,
    openDetail,
    refreshLogs,
  }
}
