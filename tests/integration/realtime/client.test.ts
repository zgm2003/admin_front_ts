import { describe, expect, it, vi } from 'vitest'
import { createApiError } from '@/modules/http/error'
import { userNamespace } from '@/modules/persistence/namespaces'
import { Persistence, type StorageAdapter } from '@/modules/persistence/store'
import {
  computeReconnectDelay,
  realtimeCursorCodec,
} from '@/modules/realtime/client'
import {
  connectReady,
  connected,
  durableNotification,
  flush,
  setup,
} from './support'

describe('RealtimeClient lifecycle', () => {
  it('defers realtime endpoint resolution until an authenticated context connects', async () => {
    const endpoint = vi.fn(() => new URL('ws://localhost:8080/api/admin/v1/realtime/ws'))
    const context = setup({ endpoint })
    expect(endpoint).not.toHaveBeenCalled()

    await context.client.connect({ userId: 7, platform: 'admin' })

    expect(endpoint).toHaveBeenCalledTimes(1)
  })

  it('uses one connection per authenticated context and becomes ready only after a valid handshake', async () => {
    const context = setup()
    await context.client.connect({ userId: 7, platform: 'admin' })
    await context.client.connect({ userId: 7, platform: 'admin' })
    expect(context.issueTicket).toHaveBeenCalledTimes(1)
    expect(context.transport.connections).toHaveLength(1)

    const connection = context.transport.connections[0]!
    connection.open()
    expect(context.client.state.value.kind).toBe('authenticating')
    connection.message(connected)
    await flush()

    expect(context.client.state.value.kind).toBe('ready')
    expect(connection.controls()).toEqual([
      {
        type: 'realtime.subscribe.v1',
        data: { topics: ['platform:admin', 'user:7'] },
      },
      {
        type: 'realtime.resume.v1',
        data: { after_sequence: 0 },
      },
    ])
  })

  it('resets exponential jitter attempts only after handshake', async () => {
    const context = setup()
    await context.client.connect({ userId: 7, platform: 'admin' })
    context.transport.connections[0]!.open()
    context.transport.connections[0]!.closeFromServer()

    context.clock.advanceBy(499)
    expect(context.transport.connections).toHaveLength(1)
    context.clock.advanceBy(1)
    await flush()
    expect(context.transport.connections).toHaveLength(2)

    const second = context.transport.connections[1]!
    second.open()
    second.closeFromServer()
    context.clock.advanceBy(999)
    expect(context.transport.connections).toHaveLength(2)
    context.clock.advanceBy(1)
    await flush()
    expect(context.transport.connections).toHaveLength(3)

    const third = context.transport.connections[2]!
    third.open()
    third.message(connected)
    await flush()
    third.closeFromServer()
    context.clock.advanceBy(500)
    await flush()
    expect(context.transport.connections).toHaveLength(4)
  })

  it('uses the specified capped exponential jitter formula', () => {
    expect(computeReconnectDelay(0, () => 0)).toBe(500)
    expect(computeReconnectDelay(1, () => 0.5)).toBe(1125)
    expect(computeReconnectDelay(20, () => 0.5)).toBe(33_750)
  })

  it('stops after the permanent authentication attempt budget', async () => {
    const permanent = createApiError({
      kind: 'authentication',
      code: 'auth.revoked',
      retryable: false,
      messageKey: 'auth.revoked',
    })
    const issueTicket = vi.fn(async () => { throw permanent })
    const context = setup({ issueTicket, maxPermanentAuthAttempts: 2 })

    await context.client.connect({ userId: 7, platform: 'admin' })
    expect(context.client.state.value.kind).toBe('waiting')
    context.clock.advanceBy(500)
    await flush()

    expect(issueTicket).toHaveBeenCalledTimes(2)
    expect(context.client.state.value.kind).toBe('failed')
    context.clock.advanceBy(30_000)
    await flush()
    expect(issueTicket).toHaveBeenCalledTimes(2)
    context.availability.change({ visible: false })
    context.availability.change({ visible: true })
    await flush()
    expect(issueTicket).toHaveBeenCalledTimes(2)
  })

  it('pauses attempts while offline or hidden and resumes on availability', async () => {
    const context = setup()
    context.availability.change({ online: false, visible: false })
    await context.client.connect({ userId: 7, platform: 'admin' })
    expect(context.issueTicket).not.toHaveBeenCalled()

    context.availability.change({ visible: true })
    await flush()
    expect(context.issueTicket).not.toHaveBeenCalled()

    context.availability.change({ online: true })
    await flush()
    expect(context.issueTicket).toHaveBeenCalledTimes(1)
  })

  it('keeps persistence failures observable without creating an unhandled connection rejection', async () => {
    const storage: StorageAdapter = {
      getItem() { throw new Error('storage unavailable') },
      setItem() {},
      removeItem() {},
      keys() { return [] },
    }
    const context = setup({ persistence: new Persistence(storage) })

    await expect(context.client.connect({ userId: 7, platform: 'admin' })).resolves.toBeUndefined()

    expect(context.client.state.value.kind).toBe('failed')
    expect(context.protocolError).toHaveBeenCalledTimes(1)
    expect(context.issueTicket).not.toHaveBeenCalled()
  })

  it('finishes logout cleanup when cursor removal fails', async () => {
    const storage: StorageAdapter = {
      getItem() { return null },
      setItem() {},
      removeItem() { throw new Error('storage removal unavailable') },
      keys() { return [] },
    }
    const context = setup({ persistence: new Persistence(storage) })
    const connection = await connectReady(context)

    await expect(context.client.disconnect({ purge: true })).resolves.toBeUndefined()

    expect(connection.closed).toBe(true)
    expect(context.client.state.value.kind).toBe('idle')
    expect(context.protocolError).toHaveBeenCalledTimes(1)
  })

  it('fails closed when a durable cursor cannot be persisted', async () => {
    const storage: StorageAdapter = {
      getItem() { return null },
      setItem() { throw new Error('storage write unavailable') },
      removeItem() {},
      keys() { return [] },
    }
    const context = setup({ persistence: new Persistence(storage) })
    const connection = await connectReady(context)
    context.client.subscribe('notification.created.v1', vi.fn())

    connection.message(durableNotification(1))

    await vi.waitFor(() => expect(context.protocolError).toHaveBeenCalledTimes(1))
    expect(connection.closed).toBe(true)
    expect(context.client.state.value.kind).toBe('failed')
  })
})

describe('RealtimeClient delivery and recovery', () => {
  it('isolates a new identity from an in-flight handler owned by the logged-out identity', async () => {
    let releaseHandler!: () => void
    const handlerGate = new Promise<void>((resolve) => { releaseHandler = resolve })
    const handlerStarted = vi.fn()
    const context = setup()
    context.client.subscribe('notification.created.v1', async () => {
      handlerStarted()
      await handlerGate
    })
    const first = await connectReady(context)
    first.message(durableNotification(1))
    await vi.waitFor(() => expect(handlerStarted).toHaveBeenCalledTimes(1))

    await context.client.disconnect({ purge: true })
    await context.client.connect({ userId: 8, platform: 'admin' })
    const second = context.transport.connections[1]!
    second.open()
    second.message({
      ...connected,
      event_id: '01J00000000000000000000008',
      data: { ...connected.data, user_id: 8 },
    })
    await vi.waitFor(() => expect(context.client.state.value.kind).toBe('ready'))

    releaseHandler()
    await flush()

    expect(context.persistence.read(userNamespace(8), 'realtime-cursor', realtimeCursorCodec)).toBeNull()
  })

  it('rejects malformed and unknown messages without disrupting valid delivery', async () => {
    const context = setup()
    const received = vi.fn()
    context.client.subscribe('notification.created.v1', received)
    const connection = await connectReady(context)

    connection.malformed('{')
    connection.message({ ...connected, type: 'unknown.event.v1' })
    connection.message(durableNotification(1))
    await vi.waitFor(() => {
      expect(context.protocolError).toHaveBeenCalledTimes(2)
      expect(received).toHaveBeenCalledTimes(1)
    })
  })

  it('isolates handlers, deduplicates 512 event IDs, and advances only the durable cursor', async () => {
    const context = setup()
    const isolated = vi.fn(() => { throw new Error('handler failure') })
    const received = vi.fn()
    context.client.subscribe('notification.created.v1', isolated)
    context.client.subscribe('notification.created.v1', received)
    const connection = await connectReady(context)

    const first = durableNotification(1)
    connection.message(first)
    connection.message(first)
    connection.message({
      event_id: '01J90000000000000000000000',
      type: 'ai.response.delta.v1',
      sequence: 0,
      occurred_at: '2026-07-18T08:00:00Z',
      durability: 'ephemeral',
      data: { conversation_id: 1, request_id: 'request-1', delta: 'chunk' },
    })
    await vi.waitFor(() => {
      expect(isolated).toHaveBeenCalledTimes(1)
      expect(received).toHaveBeenCalledTimes(1)
      expect(context.persistence.read(userNamespace(7), 'realtime-cursor', realtimeCursorCodec)).toBe(1)
    })

    for (let sequence = 2; sequence <= 514; sequence++) {
      connection.message(durableNotification(sequence))
    }
    await vi.waitFor(() => {
      expect(context.persistence.read(userNamespace(7), 'realtime-cursor', realtimeCursorCodec)).toBe(514)
    })
  })

  it('restores subscriptions and resumes from the persisted cursor after reconnect', async () => {
    const context = setup()
    const releaseOne = context.client.retainTopic('user:7')
    const releaseTwo = context.client.retainTopic('user:7')
    const first = await connectReady(context)
    first.message(durableNotification(8))
    await flush()
    releaseOne()
    first.closeFromServer()

    context.clock.advanceBy(500)
    await flush()
    const second = context.transport.connections[1]!
    second.open()
    second.message({ ...connected, event_id: '01J00000000000000000000001' })
    await vi.waitFor(() => {
      expect(second.controls()).toEqual([
        {
          type: 'realtime.subscribe.v1',
          data: { topics: ['platform:admin', 'user:7'] },
        },
        {
          type: 'realtime.resume.v1',
          data: { after_sequence: 8 },
        },
      ])
    })
    releaseTwo()
  })

  it('runs authoritative recovery before accepting the resync cursor', async () => {
    const recover = vi.fn(async () => 41)
    const context = setup({ recover })
    const connection = await connectReady(context)
    connection.message({
      event_id: '01J70000000000000000000000',
      type: 'realtime.resync_required.v1',
      sequence: 0,
      occurred_at: '2026-07-18T08:00:00Z',
      durability: 'ephemeral',
      data: { latest_sequence: 42 },
    })
    await vi.waitFor(() => {
      expect(recover).toHaveBeenCalledWith({
        latestSequence: 42,
        signal: expect.any(AbortSignal),
      })
      expect(context.persistence.read(userNamespace(7), 'realtime-cursor', realtimeCursorCodec)).toBe(41)
    })
  })

  it('supports feature-owned authoritative recovery without a global fallback', async () => {
    const context = setup({ recover: undefined })
    const recoverNotification = vi.fn(async () => undefined)
    const recoverAI = vi.fn(async () => undefined)
    context.client.registerRecovery(recoverNotification)
    context.client.registerRecovery(recoverAI)
    const connection = await connectReady(context)

    connection.message({
      event_id: '01J70000000000000000000001',
      type: 'realtime.resync_required.v1',
      sequence: 0,
      occurred_at: '2026-07-18T08:00:00Z',
      durability: 'ephemeral',
      data: { latest_sequence: 52 },
    })

    await vi.waitFor(() => {
      expect(recoverNotification).toHaveBeenCalledWith({
        latestSequence: 52,
        signal: expect.any(AbortSignal),
      })
      expect(recoverAI).toHaveBeenCalledTimes(1)
      expect(context.persistence.read(userNamespace(7), 'realtime-cursor', realtimeCursorCodec)).toBe(52)
    })
  })

  it('reconnects instead of advancing the cursor when authoritative recovery is unavailable', async () => {
    const context = setup({ recover: undefined })
    const connection = await connectReady(context)
    connection.message({
      event_id: '01J70000000000000000000002',
      type: 'realtime.resync_required.v1',
      sequence: 0,
      occurred_at: '2026-07-18T08:00:00Z',
      durability: 'ephemeral',
      data: { latest_sequence: 62 },
    })

    await vi.waitFor(() => expect(context.protocolError).toHaveBeenCalledTimes(1))
    expect(connection.closed).toBe(true)
    expect(context.persistence.read(userNamespace(7), 'realtime-cursor', realtimeCursorCodec)).toBeNull()

    context.clock.advanceBy(500)
    await flush()
    expect(context.transport.connections).toHaveLength(2)
  })

  it('reconnects when authoritative recovery returns a cursor outside the server range', async () => {
    const context = setup({ recover: vi.fn(async () => 63) })
    const connection = await connectReady(context)
    connection.message({
      event_id: '01J70000000000000000000003',
      type: 'realtime.resync_required.v1',
      sequence: 0,
      occurred_at: '2026-07-18T08:00:00Z',
      durability: 'ephemeral',
      data: { latest_sequence: 62 },
    })

    await vi.waitFor(() => expect(context.protocolError).toHaveBeenCalledTimes(1))
    expect(connection.closed).toBe(true)
    expect(context.persistence.read(userNamespace(7), 'realtime-cursor', realtimeCursorCodec)).toBeNull()
  })

  it('buffers at most 32 replay-safe controls and purges identity state on logout', async () => {
    const context = setup()
    context.persistence.write(userNamespace(7), 'realtime-cursor', realtimeCursorCodec, 9)
    await context.client.connect({ userId: 7, platform: 'admin' })
    const connection = context.transport.connections[0]!
    for (let index = 0; index < 40; index++) context.client.ping(`ping-${index}`)

    connection.open()
    connection.message(connected)
    await flush()
    expect(connection.controls()).toHaveLength(34)

    await context.client.disconnect({ purge: true })
    expect(connection.closed).toBe(true)
    expect(context.persistence.read(userNamespace(7), 'realtime-cursor', realtimeCursorCodec)).toBeNull()
  })
})
