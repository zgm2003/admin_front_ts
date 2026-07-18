import { describe, expect, it, vi } from 'vitest'
import { createClientEnvelope } from '@/modules/realtime/protocol'
import {
  ControlBuffer,
  EventIdLRU,
  identityTopics,
  RealtimeControlChannel,
  RealtimeSubscriptions,
  RecoveryRegistry,
  SubscriptionRegistry,
} from '@/modules/realtime/subscriptions'

describe('SubscriptionRegistry', () => {
  it('reference-counts exact topics and restores a stable snapshot', () => {
    const registry = new SubscriptionRegistry()
    const first = registry.retain('user:7')
    const second = registry.retain('user:7')
    const platform = registry.retain('platform:admin')
    expect(registry.topics()).toEqual(['platform:admin', 'user:7'])
    first()
    expect(registry.topics()).toEqual(['platform:admin', 'user:7'])
    second()
    expect(registry.topics()).toEqual(['platform:admin'])
    platform()
    expect(registry.topics()).toEqual([])
  })

  it('uses contract Unicode code-point length for topics', () => {
    const registry = new SubscriptionRegistry()
    expect(() => registry.retain('😀'.repeat(128))).not.toThrow()
    expect(() => registry.retain('😀'.repeat(129))).toThrow()
    expect(() => registry.retain(` ${'x'.repeat(128)}`)).toThrow()
    registry.retain(' user:7 ')
    expect(registry.topics()).toContain(' user:7 ')
  })

  it('bounds the event-id LRU to 512 entries', () => {
    const eventIds = new EventIdLRU(512)
    for (let index = 0; index < 513; index++) eventIds.accept(String(index))
    expect(eventIds.size).toBe(512)
    expect(eventIds.accept('512')).toBe(false)
    eventIds.clear()
    expect(eventIds.size).toBe(0)
  })

  it('makes release and clear idempotent while notifying only real changes', () => {
    const changed = vi.fn()
    const registry = new SubscriptionRegistry(changed)
    const release = registry.retain('user:7')
    release()
    release()
    registry.clear()
    expect(changed).toHaveBeenCalledTimes(2)

    const staleRelease = registry.retain('user:8')
    registry.clear()
    staleRelease()
    expect(changed).toHaveBeenCalledTimes(4)
  })
})

describe('realtime subscription delivery', () => {
  it('publishes to exact handlers, isolates errors, and unsubscribes cleanly', async () => {
    const onError = vi.fn()
    const subscriptions = new RealtimeSubscriptions(onError)
    const received = vi.fn()
    const release = subscriptions.subscribe('notification.created.v1', received)
    subscriptions.subscribe('notification.created.v1', () => { throw new Error('handler failed') })
    const envelope = {
      event_id: '01J00000000000000000000001',
      type: 'notification.created.v1' as const,
      sequence: 1,
      occurred_at: '2026-07-19T08:00:00Z',
      durability: 'durable' as const,
      data: {
        task_id: 1,
        title: 'title',
        content: 'content',
        link: '',
        level: 'normal' as const,
        notification_type: 'info' as const,
      },
    }

    await subscriptions.publish(envelope)
    expect(received).toHaveBeenCalledWith(envelope)
    expect(onError).toHaveBeenCalledTimes(1)

    release()
    release()
    subscriptions.clear()
    await subscriptions.publish(envelope)
    expect(received).toHaveBeenCalledTimes(1)
  })

  it('adds exact identity topics only for an authenticated identity', () => {
    expect(identityTopics(['feature:notifications'], null)).toEqual(['feature:notifications'])
    expect(identityTopics(['user:7', 'feature:notifications'], {
      userId: 7,
      platform: 'admin',
    })).toEqual(['feature:notifications', 'platform:admin', 'user:7'])
  })
})

describe('realtime control and recovery registries', () => {
  it('bounds buffered controls and flushes only after a connection is ready', () => {
    const buffer = new ControlBuffer(2)
    const first = createClientEnvelope('realtime.ping.v1', {}, 'first')
    const second = createClientEnvelope('realtime.ping.v1', {}, 'second')
    const third = createClientEnvelope('realtime.ping.v1', {}, 'third')
    buffer.push(first)
    buffer.push(second)
    buffer.push(third)
    expect(buffer.drain()).toEqual([second, third])
    expect(buffer.drain()).toEqual([])
    buffer.push(first)
    buffer.clear()
    expect(buffer.drain()).toEqual([])

    const onError = vi.fn()
    const channel = new RealtimeControlChannel(2, onError)
    const sent: string[] = []
    const connection = {
      send: vi.fn((payload: string) => sent.push(payload)),
      close: vi.fn(),
    }
    channel.send(first)
    channel.attach(connection)
    channel.flush()
    expect(sent).toEqual([JSON.stringify(first)])

    channel.markReady()
    channel.send(second)
    expect(sent.at(-1)).toBe(JSON.stringify(second))
    channel.detach()
    channel.sendImmediate(third)
    expect(sent).toHaveLength(2)

    connection.send.mockImplementationOnce(() => { throw new Error('socket closed') })
    channel.attach(connection)
    channel.markReady()
    channel.send(third)
    expect(onError).toHaveBeenCalledTimes(1)
    channel.close(connection)
    expect(connection.close).toHaveBeenCalledTimes(1)
    channel.clear()
  })

  it('requires at least one authoritative recovery handler', async () => {
    const registry = new RecoveryRegistry()
    const context = { latestSequence: 12, signal: new AbortController().signal }
    await expect(registry.recover(context)).rejects.toThrow(/authoritative feature recovery/i)

    const recover = vi.fn(async () => undefined)
    const unregister = registry.register(recover)
    await expect(registry.recover(context)).resolves.toBe(12)
    expect(recover).toHaveBeenCalledWith(context)
    unregister()
    registry.clear()
  })
})
