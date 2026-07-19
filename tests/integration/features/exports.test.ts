import { describe, expect, it, vi } from 'vitest'
import type {
  ExportTaskItem,
  ExportTaskListResponse,
} from '@/api/system/exportTask'
import {
  createExportsWorkflow,
  type ExportsWorkflowApi,
} from '@/features/exports/workflow'
import { page } from './support'

const task = (id: number): ExportTaskItem => ({
  id,
  kind: 'users',
  kind_text: 'Users',
  title: `task-${id}`,
  file_name: null,
  file_url: null,
  file_size_text: '',
  row_count: null,
  status: 1,
  status_text: 'Pending',
  error_msg: null,
  expire_at: null,
  created_at: '2026-07-19 00:00:00',
})

describe('exports workflow', () => {
  it('falls back to the previous page after deleting the last row', async () => {
    const responses: ExportTaskListResponse[] = [
      { list: [task(2)], next_id: 0, page: page(2) },
      { list: [], next_id: 0, page: page(2, 0) },
      { list: [task(1)], next_id: 0, page: page(1) },
    ]
    const list = vi.fn(async () => responses.shift()!)
    const api: ExportsWorkflowApi = {
      list,
      statusCount: vi.fn(async () => []),
      deleteOne: vi.fn(async () => undefined),
      deleteBatch: vi.fn(async () => undefined),
    }
    const workflow = createExportsWorkflow({ api })
    await workflow.list.execute({ current_page: 2, page_size: 20 })
    await workflow.deleteOne.mutate({ id: 2 })

    expect(list.mock.calls.map(([params]) => params.current_page)).toEqual([2, 2, 1])
    expect(workflow.list.state.value).toEqual({ kind: 'success', data: [task(1)] })
    workflow.dispose()
  })
})
