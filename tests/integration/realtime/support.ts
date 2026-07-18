import { vi } from 'vitest'
import { Persistence, type StorageAdapter } from '@/modules/persistence/store'
import {
  RealtimeClient,
  type RealtimeAvailability,
  type RealtimeClock,
} from '@/modules/realtime/client'
import type {
  RealtimeConnection,
  RealtimeTransport,
  RealtimeTransportHandlers,
} from '@/modules/realtime/transport'

export const connected = {
  event_id: '01J00000000000000000000000',
  type: 'realtime.connected.v1',
  sequence: 0,
  occurred_at: '2026-07-18T08:00:00Z',
  durability: 'ephemeral',
  data: { user_id: 7, platform: 'admin', heartbeat_interval_ms: 25_000 },
} as const

export function durableNotification(sequence: number, eventId = `01J${String(sequence).padStart(23, '0')}`) {
  return {
    event_id: eventId,
    type: 'notification.created.v1',
    sequence,
    occurred_at: '2026-07-18T08:00:00Z',
    durability: 'durable',
    data: {
      task_id: sequence,
      title: `title-${sequence}`,
      content: `content-${sequence}`,
      link: '/notification',
      level: 'normal',
      notification_type: 'info',
    },
  } as const
}

class MemoryStorage implements StorageAdapter {
  readonly values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
  keys() { return [...this.values.keys()] }
}

export class FakeConnection implements RealtimeConnection {
  readonly sent: string[] = []
  closed = false

  constructor(readonly handlers: RealtimeTransportHandlers) {}

  send(payload: string) { this.sent.push(payload) }
  close() { this.closed = true }
  open() { this.handlers.open() }
  message(value: unknown) { this.handlers.message(JSON.stringify(value)) }
  malformed(value: string) { this.handlers.message(value) }
  closeFromServer() { this.handlers.close({ code: 1006, reason: 'network' }) }
  controls() { return this.sent.map((value) => JSON.parse(value) as unknown) }
}

class FakeTransport implements RealtimeTransport {
  readonly connections: FakeConnection[] = []

  connect(_url: string, handlers: RealtimeTransportHandlers): RealtimeConnection {
    const connection = new FakeConnection(handlers)
    this.connections.push(connection)
    return connection
  }
}

class FakeClock implements RealtimeClock {
  private nextId = 1
  private now = 0
  private readonly timers = new Map<number, { at: number; run: () => void }>()

  setTimeout(run: () => void, delayMs: number): number {
    const id = this.nextId++
    this.timers.set(id, { at: this.now + delayMs, run })
    return id
  }

  clearTimeout(id: number): void {
    this.timers.delete(id)
  }

  advanceBy(milliseconds: number): void {
    const target = this.now + milliseconds
    while (true) {
      const due = [...this.timers.entries()]
        .filter(([, timer]) => timer.at <= target)
        .sort((left, right) => left[1].at - right[1].at)[0]
      if (!due) break
      this.now = due[1].at
      this.timers.delete(due[0])
      due[1].run()
    }
    this.now = target
  }
}

class FakeAvailability implements RealtimeAvailability {
  online = true
  visible = true
  private readonly listeners = new Set<() => void>()

  isOnline() { return this.online }
  isVisible() { return this.visible }
  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  change(input: { online?: boolean; visible?: boolean }) {
    if (input.online !== undefined) this.online = input.online
    if (input.visible !== undefined) this.visible = input.visible
    for (const listener of this.listeners) listener()
  }
}

export function flush() {
  return new Promise<void>((resolve) => queueMicrotask(resolve))
}

export function setup(overrides: Partial<ConstructorParameters<typeof RealtimeClient>[0]> = {}) {
  const transport = new FakeTransport()
  const storage = new MemoryStorage()
  const persistence = new Persistence(storage)
  const clock = new FakeClock()
  const availability = new FakeAvailability()
  const issueTicket = vi.fn(async () => 'ticket-1')
  const recover = vi.fn(async ({ latestSequence }: { latestSequence: number }) => latestSequence)
  const protocolError = vi.fn()
  const client = new RealtimeClient({
    endpoint: new URL('ws://localhost:8080/api/admin/v1/realtime/ws'),
    transport,
    persistence,
    issueTicket,
    recover,
    clock,
    availability,
    random: () => 0,
    onProtocolError: protocolError,
    ...overrides,
  })
  return { client, transport, storage, persistence, clock, availability, issueTicket, recover, protocolError }
}

export async function connectReady(context: ReturnType<typeof setup>) {
  await context.client.connect({ userId: 7, platform: 'admin' })
  const connection = context.transport.connections.at(-1)!
  connection.open()
  connection.message(connected)
  await flush()
  return connection
}
