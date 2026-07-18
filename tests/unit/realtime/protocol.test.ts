import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  clientControlTypes,
  createClientEnvelope,
  parseServerEnvelope,
  realtimeEventTypes,
  type RealtimeEventType,
} from '@/modules/realtime/protocol'
import {
  BrowserWebSocketTransport,
  buildRealtimeWebSocketURL,
} from '@/adapters/web/websocket'

const eventId = '01J00000000000000000000000'
const occurredAt = '2026-07-18T08:00:00Z'

function envelope(type: RealtimeEventType, data: unknown) {
  const durable = type === 'notification.created.v1'
    || type === 'ai.response.completed.v1'
    || type === 'ai.response.failed.v1'
    || type === 'ai.response.canceled.v1'
  return {
    event_id: eventId,
    type,
    sequence: durable ? 1 : 0,
    occurred_at: occurredAt,
    durability: durable ? 'durable' : 'ephemeral',
    data,
  }
}

describe('Admin realtime protocol', () => {
  it('covers every server and client event in the locked backend schema', () => {
    const artifact = JSON.parse(readFileSync(resolve(
      process.cwd(),
      'contracts/backend/admin/v1/realtime/events.schema.json',
    ), 'utf8')) as {
      oneOf: Array<{
        properties: { type: { const: string } }
        'x-envelope-role': 'client' | 'server'
      }>
    }
    const types = (role: 'client' | 'server') => [...new Set(artifact.oneOf
      .filter((definition) => definition['x-envelope-role'] === role)
      .map((definition) => definition.properties.type.const))].sort()

    expect([...realtimeEventTypes].sort()).toEqual(types('server'))
    expect([...clientControlTypes].sort()).toEqual(types('client'))
  })

  it.each([
    ['realtime.connected.v1', { user_id: 7, platform: 'admin', heartbeat_interval_ms: 25_000 }],
    ['realtime.subscribed.v1', { topics: ['user:7', 'platform:admin'] }],
    ['realtime.resync_required.v1', { latest_sequence: 42 }],
    ['realtime.error.v1', { code: 401, msg: 'unauthenticated realtime session' }],
    ['realtime.ping.v1', {}],
    ['realtime.pong.v1', { server_time: occurredAt }],
    ['notification.created.v1', {
      task_id: 9,
      title: 'title',
      content: 'content',
      link: '/notification',
      level: 'normal',
      notification_type: 'info',
    }],
    ['ai.response.start.v1', {
      conversation_id: 10,
      request_id: 'request-1',
      user_message_id: 11,
      agent_id: 12,
    }],
    ['ai.response.delta.v1', {
      conversation_id: 10,
      request_id: 'request-1',
      delta: 'hello',
    }],
    ['ai.response.completed.v1', {
      conversation_id: 10,
      request_id: 'request-1',
      assistant_message_id: 13,
    }],
    ['ai.response.failed.v1', {
      conversation_id: 10,
      request_id: 'request-1',
      msg: 'failed',
    }],
    ['ai.response.canceled.v1', {
      conversation_id: 10,
      request_id: 'request-1',
    }],
  ] as const)('decodes the closed %s contract', (type, data) => {
    expect(parseServerEnvelope(envelope(type, data))).toEqual(envelope(type, data))
  })

  it.each([
    {
      ...envelope('realtime.connected.v1', {
        user_id: 7,
        platform: 'admin',
        heartbeat_interval_ms: 25_000,
      }),
      unexpected: true,
    },
    envelope('unknown.event.v1' as RealtimeEventType, {}),
    envelope('realtime.connected.v1', {
      user_id: 7,
      platform: 'admin',
      heartbeat_interval_ms: 25_000,
      alias: 'forbidden',
    }),
    {
      ...envelope('notification.created.v1', {
        task_id: 9,
        title: 'title',
        content: 'content',
        link: '/',
        level: 'normal',
        notification_type: 'info',
      }),
      durability: 'ephemeral',
      sequence: 0,
    },
  ])('rejects malformed, unknown, or contract-expanding messages', (value) => {
    expect(() => parseServerEnvelope(value)).toThrow()
  })

  it('creates only the three documented client control envelopes', () => {
    expect(createClientEnvelope('realtime.ping.v1', {}, 'ping-1')).toEqual({
      type: 'realtime.ping.v1',
      request_id: 'ping-1',
      data: {},
    })
    expect(createClientEnvelope('realtime.resume.v1', { after_sequence: 12 })).toEqual({
      type: 'realtime.resume.v1',
      data: { after_sequence: 12 },
    })
    expect(createClientEnvelope('realtime.subscribe.v1', {
      topics: ['platform:admin', 'user:7'],
    })).toEqual({
      type: 'realtime.subscribe.v1',
      data: { topics: ['platform:admin', 'user:7'] },
    })

    expect(() => createClientEnvelope('realtime.subscribe.v1', { topics: [] })).toThrow()
    expect(() => createClientEnvelope('realtime.resume.v1', { after_sequence: -1 })).toThrow()
  })

  it('interprets JSON Schema maxLength as Unicode code points', () => {
    expect(createClientEnvelope('realtime.subscribe.v1', {
      topics: ['😀'.repeat(128)],
    }).data.topics).toEqual(['😀'.repeat(128)])
    expect(() => createClientEnvelope('realtime.subscribe.v1', {
      topics: ['😀'.repeat(129)],
    })).toThrow()
  })

  it('builds the exact ticket-only Admin realtime URL', () => {
    expect(buildRealtimeWebSocketURL(
      new URL('ws://localhost:8080/api/admin/v1/realtime/ws'),
      'ticket value',
    )).toBe('ws://localhost:8080/api/admin/v1/realtime/ws?ticket=ticket+value')

    expect(() => buildRealtimeWebSocketURL(
      new URL('ws://localhost:8080/not-realtime'),
      'ticket',
    )).toThrow(/realtime endpoint/i)
  })

  it('preserves the opaque ticket and sanitizes browser transport errors', () => {
    expect(buildRealtimeWebSocketURL(
      new URL('ws://localhost:8080/api/admin/v1/realtime/ws'),
      ' ticket value ',
    )).toBe('ws://localhost:8080/api/admin/v1/realtime/ws?ticket=+ticket+value+')

    const listeners = new Map<string, (event: Event) => void>()
    const rawError = { type: 'error', target: { url: 'ws://localhost/?ticket=secret' } } as unknown as Event
    class FakeWebSocket {
      static readonly OPEN = 1
      static readonly CLOSING = 2
      static readonly CLOSED = 3
      readonly readyState = 0
      addEventListener(type: string, listener: (event: Event) => void) { listeners.set(type, listener) }
      send() {}
      close() {}
    }
    vi.stubGlobal('WebSocket', FakeWebSocket)
    try {
      const onError = vi.fn()
      new BrowserWebSocketTransport().connect('ws://localhost/?ticket=secret', {
        open() {},
        message() {},
        close() {},
        error: onError,
      })
      listeners.get('error')?.(rawError)

      expect(onError).toHaveBeenCalledTimes(1)
      const reported = onError.mock.calls[0]![0]
      expect(reported).toBeInstanceOf(Error)
      expect(reported).not.toBe(rawError)
      expect(String(reported)).not.toContain('secret')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
