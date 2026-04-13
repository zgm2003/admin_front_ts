import { describe, expect, it, vi } from 'vitest'
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

    expect(list).toHaveBeenCalledWith({
      keyword: 'demo',
      current_page: 1,
      page_size: 20,
    })
    expect(table).toHaveProperty('confirmDel')
    expect(table).toHaveProperty('toggleStatus')
  })

  it('preserves delete and status actions for legacy crud pages', async () => {
    const list = vi.fn().mockResolvedValue({
      list: [{ id: 1, status: 1 }],
      page: { current_page: 2, page_size: 20, total: 1 },
    })
    const del = vi.fn().mockResolvedValue(undefined)
    const status = vi.fn().mockResolvedValue(undefined)
    confirm.mockResolvedValue(undefined)

    const table = useCrudTable({
      api: { list, del, status },
      searchForm: ref({ keyword: 'demo' }),
    })

    expect(table).toHaveProperty('onSearch')

    table.onSelectionChange([{ id: 1, status: 1 }])
    await table.confirmDel({ id: 1, status: 1 })
    await table.batchDel()
    await table.toggleStatus({ id: 1, status: 1 }, 2)

    expect(del).toHaveBeenNthCalledWith(1, { id: 1 })
    expect(del).toHaveBeenNthCalledWith(2, { id: [1] })
    expect(status).toHaveBeenCalledWith({ id: 1, status: 2 })
    expect(success).toHaveBeenCalledTimes(3)
  })
})
