import { describe, expect, it, vi } from 'vitest'
import { userNamespace } from '@/modules/persistence/namespaces'
import { realtimeCursorCodec } from '@/modules/realtime/client'
import {
  connectReady,
  connected,
  durableNotification,
  setup,
} from './support'

describe('RealtimeClient handshake policy', () => {
  it('does not consume domain events before the connected handshake', async () => {
    const context = setup()
    const received = vi.fn()
    context.client.subscribe('notification.created.v1', received)
    await context.client.connect({ userId: 7, platform: 'admin' })
    const connection = context.transport.connections[0]!
    connection.open()

    connection.message(durableNotification(1))
    await vi.waitFor(() => expect(context.protocolError).toHaveBeenCalledTimes(1))
    expect(received).not.toHaveBeenCalled()
    expect(context.persistence.read(userNamespace(7), 'realtime-cursor', realtimeCursorCodec)).toBeNull()

    connection.message(connected)
    connection.message(durableNotification(1))
    await vi.waitFor(() => expect(received).toHaveBeenCalledTimes(1))
    expect(context.persistence.read(userNamespace(7), 'realtime-cursor', realtimeCursorCodec)).toBe(1)
  })

  it('does not infer connection policy from undocumented realtime error codes', async () => {
    const context = setup()
    const received = vi.fn()
    context.client.subscribe('realtime.error.v1', received)
    const connection = await connectReady(context)

    connection.message({
      event_id: '01J80000000000000000000000',
      type: 'realtime.error.v1',
      sequence: 0,
      occurred_at: '2026-07-18T08:00:00Z',
      durability: 'ephemeral',
      data: { code: 403, msg: 'topic rejected' },
    })

    await vi.waitFor(() => expect(received).toHaveBeenCalledTimes(1))
    expect(connection.closed).toBe(false)
    expect(context.client.state.value.kind).toBe('ready')
  })
})
