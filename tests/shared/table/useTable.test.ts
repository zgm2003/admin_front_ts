import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

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

    expect(list).toHaveBeenCalledWith({
      keyword: 'demo',
      current_page: 3,
      page_size: 50,
    })
  })
})
