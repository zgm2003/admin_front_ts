import { afterEach, describe, expect, it } from 'vitest'
import { AiMessageApi } from '@/api/ai/messages'
import { AiRunApi } from '@/api/ai/runs'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('AI consumer interaction API behavior', () => {
  it('executes the exact generated revision, regeneration, delete and feedback operations', async () => {
    const harness = installApiClientHarness()
    cleanups.push(harness.uninstall)

    harness.respondWith({
      conversation_id: 17,
      user_message_id: 501,
      command_id: 601,
      request_id: 'revision-request',
      state: 'pending',
    })
    await AiMessageApi.revise({
      conversation_id: 17,
      message_id: 101,
      content: 'Corrected question',
      request_id: 'revision-request',
    })

    harness.respondWith({
      conversation_id: 18,
      user_message_id: 502,
      command_id: 602,
      request_id: 'regeneration-request',
      state: 'pending',
    })
    await AiMessageApi.regenerate({
      conversation_id: 18,
      message_id: 202,
      request_id: 'regeneration-request',
    })

    harness.respondWith({ deleted_ids: [303, 404] })
    await AiMessageApi.deleteBatch({ conversation_id: 19, ids: [404, 303] })

    harness.respondWith({ id: 707, liked: true, liked_at: '2026-07-27T10:00:00Z' })
    await AiRunApi.setUserFeedback({ id: 707, liked: true })

    expect(harness.requests.map(({ method, path, body }) => ({ method, path, body }))).toEqual([
      {
        method: 'POST',
        path: '/api/admin/v1/ai-conversations/17/messages/101/revisions',
        body: { content: 'Corrected question', request_id: 'revision-request' },
      },
      {
        method: 'POST',
        path: '/api/admin/v1/ai-conversations/18/messages/202/regenerations',
        body: { request_id: 'regeneration-request' },
      },
      {
        method: 'DELETE',
        path: '/api/admin/v1/ai-conversations/19/messages',
        body: { ids: [404, 303] },
      },
      {
        method: 'PUT',
        path: '/api/admin/v1/ai-runs/707/user-feedback',
        body: { liked: true },
      },
    ])
  })

  it('rejects invalid interaction inputs before transport', () => {
    const harness = installApiClientHarness()
    cleanups.push(harness.uninstall)

    expect(() => AiMessageApi.revise({
      conversation_id: 17,
      message_id: 101,
      content: '   ',
      request_id: 'revision-request',
    })).toThrow(/content.*non-empty/i)
    expect(() => AiMessageApi.revise({
      conversation_id: 17,
      message_id: 101,
      content: 'Corrected question',
      request_id: '   ',
    })).toThrow(/request id.*non-empty/i)
    expect(() => AiMessageApi.regenerate({
      conversation_id: 18,
      message_id: 202,
      request_id: '',
    })).toThrow(/request id.*non-empty/i)
    expect(() => AiMessageApi.deleteBatch({ conversation_id: 19, ids: [] }))
      .toThrow(/must not be empty/i)
    expect(() => AiMessageApi.deleteBatch({ conversation_id: 19, ids: [303, 303] }))
      .toThrow(/unique/i)
    expect(() => AiMessageApi.deleteBatch({ conversation_id: 19, ids: [303, -1] }))
      .toThrow(/positive integer/i)
    expect(() => AiRunApi.setUserFeedback({ id: 707, liked: undefined as never }))
      .toThrow(/boolean/i)
    expect(harness.requests).toEqual([])
  })
})
