import { describe, expect, it, vi } from 'vitest'
import { userNamespace } from '@/modules/persistence/namespaces'
import { realtimeCursorCodec } from '@/modules/realtime/client'
import {
  connectReady,
  connected,
  durableNotification,
  flush,
  setup,
} from './support'

describe('RealtimeClient durable handler retry', () => {
  it('replays a failed durable event and ignores later messages queued by the old connection', async () => {
    const context = setup()
    let firstAttempt = true
    const authoritative = vi.fn(() => {
      if (firstAttempt) {
        firstAttempt = false
        throw new Error('handler failure')
      }
    })
    const received = vi.fn()
    context.client.subscribe('notification.created.v1', authoritative)
    context.client.subscribe('notification.created.v1', received)
    const firstConnection = await connectReady(context)

    const first = durableNotification(1)
    firstConnection.message(first)
    firstConnection.message(durableNotification(2))
    await vi.waitFor(() => {
      expect(firstConnection.closed).toBe(true)
      expect(authoritative).toHaveBeenCalledTimes(1)
      expect(received).toHaveBeenCalledTimes(1)
    })
    expect(context.persistence.read(userNamespace(7), 'realtime-cursor', realtimeCursorCodec)).toBeNull()

    context.clock.advanceBy(500)
    await flush()
    const secondConnection = context.transport.connections[1]!
    secondConnection.open()
    secondConnection.message({
      ...connected,
      event_id: '01J00000000000000000000009',
    })
    await vi.waitFor(() => expect(context.client.state.value.kind).toBe('ready'))

    secondConnection.message(first)
    await vi.waitFor(() => {
      expect(context.persistence.read(userNamespace(7), 'realtime-cursor', realtimeCursorCodec)).toBe(1)
    })
    expect(authoritative).toHaveBeenCalledTimes(2)
    expect(received).toHaveBeenCalledTimes(2)

    secondConnection.message(durableNotification(2))
    await vi.waitFor(() => {
      expect(context.persistence.read(userNamespace(7), 'realtime-cursor', realtimeCursorCodec)).toBe(2)
    })
  })
})
