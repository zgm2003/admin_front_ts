import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createApiError } from '@/modules/http/error'

vi.mock('element-plus', () => ({
  ElMessageBox: {
    confirm: vi.fn(),
  },
  ElNotification: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: (key: string) => key,
    },
  },
}))

const { useTable } = await import('../../../src/components/Table/src/useTable')

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('useTable', () => {
  it('keeps only table and pagination responsibilities in the public api', () => {
    const searchForm = ref({ keyword: 'demo' })
    const list = vi.fn()

    const table = useTable({
      api: { list },
      searchForm,
    })

    expect(table).toHaveProperty('resetPage')
    expect(table).not.toHaveProperty('onSearch')
    expect(table).not.toHaveProperty('confirmDel')
    expect(table).not.toHaveProperty('batchDel')
    expect(table).not.toHaveProperty('toggleStatus')
  })

  it('sends only the normalized current_page pagination input', async () => {
    const list = vi.fn().mockResolvedValue({
      list: [],
      page: { current_page: 3, page_size: 50, total: 0 },
    })

    const table = useTable({
      api: { list },
      searchForm: ref({ keyword: 'demo' }),
      initPage: { current_page: 3, page_size: 50 },
    })

    await table.getList()

    expect(list).toHaveBeenCalledWith(
      {
        keyword: 'demo',
        current_page: 3,
        page_size: 50,
      },
      { signal: expect.any(AbortSignal) },
    )
  })

  it('keeps latest search data, page, loading, and stable selection when responses reverse', async () => {
    const requestA = deferred<{ list: Array<{ id: number }>; page: { current_page: number; page_size: number; total: number } }>()
    const requestB = deferred<{ list: Array<{ id: number }>; page: { current_page: number; page_size: number; total: number } }>()
    const signals: AbortSignal[] = []
    const list = vi.fn((_params, context: { signal: AbortSignal }) => {
      signals.push(context.signal)
      return signals.length === 1 ? requestA.promise : requestB.promise
    })
    const searchForm = ref({ keyword: 'A' })
    const table = useTable({ api: { list }, searchForm })
    table.onSelectionChange([{ id: 1 }, { id: 2 }])

    const first = table.getList()
    searchForm.value = { keyword: 'B' }
    const second = table.getList()
    expect(signals[0]?.aborted).toBe(true)

    requestB.resolve({
      list: [{ id: 2 }, { id: 3 }],
      page: { current_page: 1, page_size: 20, total: 2 },
    })
    await second
    requestA.resolve({
      list: [{ id: 1 }],
      page: { current_page: 4, page_size: 20, total: 61 },
    })
    await first

    expect(table.data.value).toEqual([{ id: 2 }, { id: 3 }])
    expect(table.page.value).toEqual({ current_page: 1, page_size: 20, total: 2 })
    expect(table.selectedIds.value).toEqual([2])
    expect(table.loading.value).toBe(false)
  })

  it('preserves rows during refresh, exposes typed failure, and retries', async () => {
    const refresh = deferred<{ list: Array<{ id: number }>; page: { current_page: number; page_size: number; total: number } }>()
    const list = vi.fn()
      .mockResolvedValueOnce({
        list: [{ id: 1 }],
        page: { current_page: 1, page_size: 20, total: 1 },
      })
      .mockImplementationOnce(() => refresh.promise)
      .mockResolvedValueOnce({
        list: [{ id: 2 }],
        page: { current_page: 1, page_size: 20, total: 1 },
      })
    const table = useTable({ api: { list } })
    await table.getList()

    const refreshFlight = table.refresh()
    expect(table.loading.value).toBe(true)
    expect(table.data.value).toEqual([{ id: 1 }])
    const failure = createApiError({
      kind: 'network',
      code: 'http.network',
      retryable: true,
      messageKey: 'http.network',
    })
    refresh.reject(failure)

    await expect(refreshFlight).rejects.toBe(failure)
    expect(table.state.value).toEqual({ kind: 'error', data: [{ id: 1 }], error: failure })
    await table.retry()
    expect(table.data.value).toEqual([{ id: 2 }])
  })

  it('resets the current page when page size changes', async () => {
    const list = vi.fn().mockResolvedValue({
      list: [{ id: 1 }],
      page: { current_page: 1, page_size: 50, total: 1 },
    })
    const table = useTable({
      api: { list },
      initPage: { current_page: 3, page_size: 20, total: 41 },
    })

    await table.onPageChange({ current_page: 3, page_size: 50, total: 41 })

    expect(list).toHaveBeenCalledWith(
      { current_page: 1, page_size: 50 },
      { signal: expect.any(AbortSignal) },
    )
  })

  it('falls back from an empty deleted page and refreshes the effective previous page', async () => {
    const list = vi.fn()
      .mockResolvedValueOnce({
        list: [],
        page: { current_page: 2, page_size: 10, total: 10 },
      })
      .mockResolvedValue({
        list: [{ id: 10 }],
        page: { current_page: 1, page_size: 10, total: 10 },
      })
    const table = useTable({
      api: { list },
      initPage: { current_page: 2, page_size: 10 },
    })

    await table.getList()
    await table.refresh()

    expect(list.mock.calls.map(([params]) => params)).toEqual([
      { current_page: 2, page_size: 10 },
      { current_page: 1, page_size: 10 },
      { current_page: 1, page_size: 10 },
    ])
    expect(table.page.value.current_page).toBe(1)
    expect(table.data.value).toEqual([{ id: 10 }])
  })

  it('does not invent a fallback when the documented response is already page one', async () => {
    const list = vi.fn().mockResolvedValue({
      list: [],
      page: { current_page: 1, page_size: 10, total: 0 },
    })
    const table = useTable({
      api: { list },
      initPage: { current_page: 3, page_size: 10 },
    })

    await table.getList()

    expect(list).toHaveBeenCalledTimes(1)
    expect(table.page.value.current_page).toBe(1)
    expect(table.state.value).toEqual({ kind: 'empty', data: [] })
  })
})
