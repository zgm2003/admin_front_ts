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

    const unsubscribeNotification = onWsMessage('notification', notificationHandler)
    const unsubscribeBroadcast = onWsMessage('broadcast', broadcastHandler)

    emitWsMessage({ type: 'notification', data: { title: 'demo' } })

    expect(notificationHandler).toHaveBeenCalledWith({
      type: 'notification',
      data: { title: 'demo' },
    })
    expect(broadcastHandler).not.toHaveBeenCalled()

    unsubscribeNotification()
    unsubscribeBroadcast()
  })

  it('removes handlers through both unsubscribe function and offWsMessage', () => {
    const handler = vi.fn()

    const unsubscribe = onWsMessage('notification', handler)
    unsubscribe()
    emitWsMessage({ type: 'notification', data: { title: 'demo' } })
    expect(handler).not.toHaveBeenCalled()

    onWsMessage('notification', handler)
    offWsMessage('notification', handler)
    emitWsMessage({ type: 'notification', data: { title: 'demo-2' } })
    expect(handler).not.toHaveBeenCalled()
  })
})
