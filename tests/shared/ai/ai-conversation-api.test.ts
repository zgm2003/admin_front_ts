import { afterEach, describe, expect, it } from 'vitest'
import { AiConversationApi } from '@/api/ai/conversations'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('AI conversation API behavior', () => {
  it('executes only the documented current-user conversation operations', async () => {
    const harness = installApiClientHarness({
      list: [],
      next_time: '',
      next_id: 0,
      has_more: false,
    })
    cleanups.push(harness.uninstall)

    await AiConversationApi.list()
    harness.respondWith({
      id: 7,
      agent_id: 3,
      agent_name: 'Agent',
      title: 'Chat',
      last_message_at: '',
      created_at: '2026-07-19T00:00:00Z',
      updated_at: '2026-07-19T00:00:00Z',
    })
    await AiConversationApi.detail({ id: 7 })
    harness.respondWith({ id: 8 })
    await AiConversationApi.create({ agent_id: 3, title: 'New chat' })
    harness.respondWith({})
    await AiConversationApi.update({ id: 8, title: 'Renamed' })
    await AiConversationApi.deleteOne({ id: 8 })

    expect(harness.requests.map(({ method, path }) => [method, path])).toEqual([
      ['GET', '/api/admin/v1/ai-conversations'],
      ['GET', '/api/admin/v1/ai-conversations/7'],
      ['POST', '/api/admin/v1/ai-conversations'],
      ['PUT', '/api/admin/v1/ai-conversations/8'],
      ['DELETE', '/api/admin/v1/ai-conversations/8'],
    ])
  })

  it('rejects invalid conversation identities before transport', async () => {
    const harness = installApiClientHarness()
    cleanups.push(harness.uninstall)

    expect(() => AiConversationApi.detail({ id: 0 })).toThrow(/positive integer/i)
    expect(harness.requests).toEqual([])
  })
})
