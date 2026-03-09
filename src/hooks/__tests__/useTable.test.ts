import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('element-plus', () => ({
  ElNotification: {
    success: vi.fn(),
    error: vi.fn(),
  },
  ElMessageBox: {
    confirm: vi.fn().mockResolvedValue(true),
  },
}))

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: (key: string) => key,
    },
  },
}))

import { useTable } from '../useTable'
import { ElMessageBox, ElNotification } from 'element-plus'

describe('useTable batchDel routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ElMessageBox.confirm).mockResolvedValue(true as never)
  })

  it('uses api.del for batch delete even if api.batchDel exists', async () => {
    const api = {
      list: vi.fn().mockResolvedValue({ list: [], page: { current_page: 1, page_size: 20, total: 0 } }),
      del: vi.fn().mockResolvedValue(undefined),
      batchDel: vi.fn().mockResolvedValue(undefined),
    }

    const table = useTable({ api })
    table.onSelectionChange([{ id: 11 }, { id: 22 }])

    await table.batchDel()

    expect(api.del).toHaveBeenCalledTimes(1)
    expect(api.del).toHaveBeenCalledWith({ id: [11, 22] })
    expect(api.batchDel).not.toHaveBeenCalled()
    expect(ElNotification.success).toHaveBeenCalledTimes(1)
  })

  it('uses api.del for batch delete with selected ids', async () => {
    const api = {
      list: vi.fn().mockResolvedValue({ list: [], page: { current_page: 1, page_size: 20, total: 0 } }),
      del: vi.fn().mockResolvedValue(undefined),
    }

    const table = useTable({ api })
    table.onSelectionChange([{ id: 33 }, { id: 44 }])

    await table.batchDel()

    expect(api.del).toHaveBeenCalledTimes(1)
    expect(api.del).toHaveBeenCalledWith({ id: [33, 44] })
    expect(ElNotification.success).toHaveBeenCalledTimes(1)
  })
})
