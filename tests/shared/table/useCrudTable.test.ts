import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createApiError } from '@/modules/http/error'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise })
  return { promise, resolve }
}

const confirm = vi.fn()
const success = vi.fn()
const error = vi.fn()

vi.mock('element-plus', () => ({
  ElMessageBox: {
    confirm,
  },
  ElNotification: {
    success,
    error,
  },
}))

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: (key: string) => key,
    },
  },
}))

const { useCrudTable } = await import('../../../src/hooks/useCrudTable')

describe('useCrudTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('supports standard list pages even when delete and status actions are absent', async () => {
    const list = vi.fn().mockResolvedValue({
      list: [{ id: 1 }],
      page: { current_page: 3, page_size: 20, total: 1 },
    })

    const table = useCrudTable({
      api: { list },
      searchForm: ref({ keyword: 'demo' }),
    })

    const search = table.onSearch()
    expect(search).toBeInstanceOf(Promise)
    await search

    expect(list).toHaveBeenCalledWith(
      {
        keyword: 'demo',
        current_page: 1,
        page_size: 20,
      },
      { signal: expect.any(AbortSignal) },
    )
    expect(table).toHaveProperty('confirmDel')
    expect(table).toHaveProperty('toggleStatus')
  })

  it('uses only standard deleteOne, deleteBatch, and changeStatus methods', async () => {
    const list = vi.fn().mockResolvedValue({
      list: [{ id: 1, status: 1 }],
      page: { current_page: 1, page_size: 20, total: 1 },
    })
    const deleteOne = vi.fn().mockResolvedValue(undefined)
    const deleteBatch = vi.fn().mockResolvedValue(undefined)
    const changeStatus = vi.fn().mockResolvedValue(undefined)
    confirm.mockResolvedValue(undefined)

    const table = useCrudTable({
      api: { list, deleteOne, deleteBatch, changeStatus },
      searchForm: ref({ keyword: 'demo' }),
    })

    await table.getList()
    table.onSelectionChange([{ id: 1, status: 1 }])
    await table.confirmDel({ id: 1, status: 1 })
    await table.batchDel()
    await table.toggleStatus({ id: 1, status: 1 }, 2)

    expect(deleteOne).toHaveBeenCalledWith({ id: 1 }, { signal: expect.any(AbortSignal) })
    expect(deleteBatch).toHaveBeenCalledWith({ ids: [1] }, { signal: expect.any(AbortSignal) })
    expect(changeStatus).toHaveBeenCalledWith({ id: 1, status: 2 }, { signal: expect.any(AbortSignal) })
    expect(success).toHaveBeenCalledTimes(3)
  })

  it('deduplicates a pending delete and preserves rows on typed failure', async () => {
    const list = vi.fn().mockResolvedValue({
      list: [{ id: 1 }],
      page: { current_page: 1, page_size: 20, total: 1 },
    })
    const pending = deferred<unknown>()
    const deleteOne = vi.fn(() => pending.promise)
    confirm.mockResolvedValue(undefined)
    const table = useCrudTable({ api: { list, deleteOne } })
    await table.getList()

    const first = table.confirmDel({ id: 1 })
    const duplicate = table.confirmDel({ id: 1 })
    expect(confirm).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(deleteOne).toHaveBeenCalledTimes(1))
    pending.resolve(undefined)
    await Promise.all([first, duplicate])
    expect(success).toHaveBeenCalledTimes(1)

    const failure = createApiError({
      kind: 'business',
      code: 'user.delete_rejected',
      retryable: false,
      messageKey: 'user.delete_rejected',
    })
    deleteOne.mockRejectedValueOnce(failure)
    await expect(table.confirmDel({ id: 1 })).rejects.toBe(failure)
    expect(table.data.value).toEqual([{ id: 1 }])
  })

  it('clears selection and falls back after a successful batch deletion', async () => {
    const list = vi.fn()
      .mockResolvedValueOnce({
        list: [{ id: 21 }],
        page: { current_page: 2, page_size: 20, total: 21 },
      })
      .mockResolvedValueOnce({
        list: [],
        page: { current_page: 2, page_size: 20, total: 20 },
      })
      .mockResolvedValueOnce({
        list: [{ id: 20 }],
        page: { current_page: 1, page_size: 20, total: 20 },
      })
    const deleteBatch = vi.fn().mockResolvedValue(undefined)
    confirm.mockResolvedValue(undefined)
    const table = useCrudTable({
      api: { list, deleteBatch },
      initPage: { current_page: 2 },
    })
    await table.getList()
    table.onSelectionChange([{ id: 21 }])

    await table.batchDel()

    expect(table.selectedIds.value).toEqual([])
    expect(table.page.value.current_page).toBe(1)
    expect(table.data.value).toEqual([{ id: 20 }])
  })

  it('does not keep legacy del/status fallback source paths', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/hooks/useCrudTable.ts'), 'utf8')

    expect(source).not.toMatch(/\bapi\.del\b/)
    expect(source).not.toMatch(/\bapi\.status\b/)
    expect(source).not.toContain('api.deleteOne/api.del')
    expect(source).not.toContain('api.changeStatus/api.status')
  })
})
