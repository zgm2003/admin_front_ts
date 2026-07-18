import { describe, expect, it } from 'vitest'
import { EventIdLRU, SubscriptionRegistry } from '@/modules/realtime/subscriptions'

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
  })
})
