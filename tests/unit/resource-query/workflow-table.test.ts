import { shallowRef } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useWorkflowTable } from '@/features/shared/use-workflow-table'
import type { ResourceState } from '@/modules/resource-query/types'

interface Row { readonly id: number; readonly name: string }
interface Params {
  readonly current_page: number
  readonly page_size: number
  readonly keyword?: string
}

describe('workflow table adapter', () => {
  it('passes exact search/page parameters and resets page when page size or search changes', async () => {
    const state = shallowRef<ResourceState<Row>>({ kind: 'success', data: [{ id: 1, name: 'one' }] })
    const page = shallowRef({ current_page: 3, page_size: 20, total: 41, total_page: 3 })
    const execute = vi.fn(async () => ({ list: [], page: page.value }))
    const refresh = vi.fn(async () => ({ list: [], page: page.value }))
    const table = useWorkflowTable<Row, Params>({
      resource: {
        state,
        execute,
        refresh,
        retry: vi.fn(),
        reset: vi.fn(),
        dispose: vi.fn(),
      },
      page,
      searchForm: shallowRef({ keyword: 'contract' }),
    })

    await table.onPageChange({ ...page.value, current_page: 2, page_size: 50 })
    expect(execute).toHaveBeenLastCalledWith({
      keyword: 'contract',
      current_page: 1,
      page_size: 50,
    })

    await table.onSearch()
    expect(execute).toHaveBeenLastCalledWith({
      keyword: 'contract',
      current_page: 1,
      page_size: 20,
    })
    expect(table.data.value).toEqual([{ id: 1, name: 'one' }])
  })
})
