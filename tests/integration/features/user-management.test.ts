import { describe, expect, it, vi } from 'vitest'
import type { UserListItem, UserListResponse } from '@/types/user'
import {
  createUserManagementWorkflow,
  type UserManagementWorkflowApi,
} from '@/features/user-management/workflow'
import { deferred, page } from './support'

const user = (id: number): UserListItem => ({
  id,
  username: `user-${id}`,
  email: '',
  phone: '',
  avatar: null,
  sex: 0,
  sex_show: '',
  role_id: 1,
  role_name: '',
  bio: '',
  address_show: '',
  address_id: 0,
  detail_address: '',
  status: 1,
  created_at: '2026-07-19 00:00:00',
})

function api(list: UserManagementWorkflowApi['list']): UserManagementWorkflowApi {
  return {
    list,
    update: vi.fn(async () => undefined),
    batchEdit: vi.fn(async () => undefined),
    changeStatus: vi.fn(async () => undefined),
    deleteOne: vi.fn(async () => undefined),
    deleteBatch: vi.fn(async () => undefined),
  }
}

describe('user management workflow', () => {
  it('commits only the latest reverse-order list response', async () => {
    const first = deferred<UserListResponse>()
    const second = deferred<UserListResponse>()
    const list = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise)
    const workflow = createUserManagementWorkflow({ api: api(list) })

    const requestA = workflow.list.execute({ current_page: 1, page_size: 20, username: 'A' })
    const requestB = workflow.list.execute({ current_page: 1, page_size: 20, username: 'B' })
    second.resolve({ list: [user(2)], page: page() })
    await requestB
    first.resolve({ list: [user(1)], page: page() })
    await requestA

    expect(workflow.list.state.value).toEqual({ kind: 'success', data: [user(2)] })
    expect(list.mock.calls[0]?.[1].signal.aborted).toBe(true)
    workflow.dispose()
  })

  it('preserves committed data when a mutation fails', async () => {
    const dependency = api(vi.fn(async () => ({ list: [user(7)], page: page() })))
    dependency.deleteOne = vi.fn(async () => { throw new Error('delete failed') })
    const workflow = createUserManagementWorkflow({ api: dependency })
    await workflow.list.execute({ current_page: 1, page_size: 20 })

    await expect(workflow.deleteOne.mutate({ id: 7 })).rejects.toMatchObject({
      kind: 'internal',
    })
    expect(workflow.list.state.value).toMatchObject({ kind: 'success', data: [user(7)] })
    workflow.dispose()
  })
})
