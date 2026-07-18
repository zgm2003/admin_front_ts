import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

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

    table.onSearch()

    await Promise.resolve()

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

    table.onSelectionChange([{ id: 1, status: 1 }])
    await table.confirmDel({ id: 1, status: 1 })
    await table.batchDel()
    await table.toggleStatus({ id: 1, status: 1 }, 2)

    expect(deleteOne).toHaveBeenCalledWith({ id: 1 })
    expect(deleteBatch).toHaveBeenCalledWith({ ids: [1] })
    expect(changeStatus).toHaveBeenCalledWith({ id: 1, status: 2 })
    expect(success).toHaveBeenCalledTimes(3)
  })

  it('does not keep legacy del/status fallback source paths', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/hooks/useCrudTable.ts'), 'utf8')

    expect(source).not.toMatch(/\bapi\.del\b/)
    expect(source).not.toMatch(/\bapi\.status\b/)
    expect(source).not.toContain('api.deleteOne/api.del')
    expect(source).not.toContain('api.changeStatus/api.status')
  })
})
