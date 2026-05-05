import { describe, expect, it, vi } from 'vitest'

const {
  emitWsMessage,
  offWsMessage,
  onWsMessage,
} = await import('../../../src/lib/realtime/message-bus')

describe('message-bus', () => {
  it('dispatches messages only to handlers of the same type', () => {
    const notificationHandler = vi.fn()
    const broadcastHandler = vi.fn()

    const unsubscribeNotification = onWsMessage('notification.created.v1', notificationHandler)
    const unsubscribeBroadcast = onWsMessage('broadcast.created.v1', broadcastHandler)

    emitWsMessage({ type: 'notification.created.v1', request_id: 'rid-1', data: { title: 'demo' } })

    expect(notificationHandler).toHaveBeenCalledWith({
      type: 'notification.created.v1',
      request_id: 'rid-1',
      data: { title: 'demo' },
    })
    expect(broadcastHandler).not.toHaveBeenCalled()

    unsubscribeNotification()
    unsubscribeBroadcast()
  })

  it('removes handlers through both unsubscribe function and offWsMessage', () => {
    const handler = vi.fn()

    const unsubscribe = onWsMessage('notification.created.v1', handler)
    unsubscribe()
    emitWsMessage({ type: 'notification.created.v1', data: { title: 'demo' } })
    expect(handler).not.toHaveBeenCalled()

    onWsMessage('notification.created.v1', handler)
    offWsMessage('notification.created.v1', handler)
    emitWsMessage({ type: 'notification.created.v1', data: { title: 'demo-2' } })
    expect(handler).not.toHaveBeenCalled()
  })
})
