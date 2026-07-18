import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { defineCodec } from '@/modules/persistence/codec'
import {
  Persistence,
  PersistenceError,
  type StorageAdapter,
} from '@/modules/persistence/store'
import {
  deviceNamespace,
  userNamespace,
} from '@/modules/persistence/namespaces'
import {
  deviceIdentityCodec,
  reconcileUserPreferences,
  userPreferencesCodec,
} from '@/modules/persistence/preferences'
import { createDeviceIdProvider } from '@/lib/http/device'

class MemoryStorage implements StorageAdapter {
  readonly values = new Map<string, string>()
  failWrite: Error | null = null

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    if (this.failWrite) throw this.failWrite
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  keys(): readonly string[] {
    return [...this.values.keys()]
  }
}

const valueCodec = defineCodec({
  version: 2,
  maxBytes: 256,
  schema: z.object({ value: z.string() }).strict(),
  migrate(version, value) {
    if (version !== 1 || typeof value !== 'object' || value === null || !('legacy' in value)) return null
    return { value: String(value.legacy) }
  },
})

describe('Persistence', () => {
  it('discards corrupt JSON and removes the invalid key', () => {
    const storage = new MemoryStorage()
    storage.values.set('admin:1:device:sample', '{broken')
    const persistence = new Persistence(storage)

    expect(persistence.read(deviceNamespace, 'sample', valueCodec)).toBeNull()
    expect(storage.values.has('admin:1:device:sample')).toBe(false)
  })

  it('migrates a known older version and rejects an unknown version', () => {
    const storage = new MemoryStorage()
    const persistence = new Persistence(storage, { now: () => 1_000 })
    storage.values.set('admin:1:device:sample', JSON.stringify({
      version: 1,
      value: { legacy: 'migrated' },
    }))

    expect(persistence.read(deviceNamespace, 'sample', valueCodec)).toEqual({ value: 'migrated' })
    expect(JSON.parse(storage.values.get('admin:1:device:sample') ?? '{}')).toMatchObject({
      version: 2,
      value: { value: 'migrated' },
    })

    storage.values.set('admin:1:device:sample', JSON.stringify({
      version: 99,
      value: { legacy: 'future' },
    }))
    expect(persistence.read(deviceNamespace, 'sample', valueCodec)).toBeNull()
    expect(storage.values.has('admin:1:device:sample')).toBe(false)
  })

  it('expires values at the exact deadline', () => {
    let now = 100
    const storage = new MemoryStorage()
    const persistence = new Persistence(storage, { now: () => now })
    persistence.write(deviceNamespace, 'sample', valueCodec, { value: 'short' }, { ttlMs: 50 })

    now = 149
    expect(persistence.read(deviceNamespace, 'sample', valueCodec)).toEqual({ value: 'short' })
    now = 150
    expect(persistence.read(deviceNamespace, 'sample', valueCodec)).toBeNull()
  })

  it('rejects oversized writes and discards oversized stored values', () => {
    const storage = new MemoryStorage()
    const persistence = new Persistence(storage)

    expect(() => persistence.write(
      deviceNamespace,
      'sample',
      valueCodec,
      { value: 'x'.repeat(300) },
    )).toThrowError(PersistenceError)

    storage.values.set('admin:1:device:sample', 'x'.repeat(300))
    expect(persistence.read(deviceNamespace, 'sample', valueCodec)).toBeNull()
    expect(storage.values.has('admin:1:device:sample')).toBe(false)
  })

  it('reports quota failures instead of pretending persistence succeeded', () => {
    const storage = new MemoryStorage()
    const quota = new Error('quota full')
    quota.name = 'QuotaExceededError'
    storage.failWrite = quota
    const persistence = new Persistence(storage)

    expect(() => persistence.write(deviceNamespace, 'sample', valueCodec, { value: 'one' }))
      .toThrow(expect.objectContaining({ kind: 'quota' }))
  })

  it('separates device and user namespaces and clears only one identity on logout', () => {
    const storage = new MemoryStorage()
    const persistence = new Persistence(storage)
    persistence.write(deviceNamespace, 'sample', valueCodec, { value: 'device' })
    persistence.write(userNamespace(7), 'sample', valueCodec, { value: 'user-7' })
    persistence.write(userNamespace(8), 'sample', valueCodec, { value: 'user-8' })

    persistence.clearNamespace(userNamespace(7))

    expect(persistence.read(deviceNamespace, 'sample', valueCodec)).toEqual({ value: 'device' })
    expect(persistence.read(userNamespace(7), 'sample', valueCodec)).toBeNull()
    expect(persistence.read(userNamespace(8), 'sample', valueCodec)).toEqual({ value: 'user-8' })
  })
})

describe('typed preferences', () => {
  it('never accepts a credential or principal field in device/user preference values', () => {
    expect(deviceIdentityCodec.safeDecode({ deviceId: '8d4fc816-0eb7-4b72-a31f-25d8fb98c819' })).toEqual({
      deviceId: '8d4fc816-0eb7-4b72-a31f-25d8fb98c819',
    })
    expect(() => deviceIdentityCodec.decode({
      deviceId: '8d4fc816-0eb7-4b72-a31f-25d8fb98c819',
      access_token: 'secret',
    })).toThrow()
    expect(() => userPreferencesCodec.decode({
      tabs: [],
      selectedMenuId: '0',
      lastRoute: '/home',
      tables: {},
      filters: {},
      principal: { userId: 7 },
    })).toThrow()
  })

  it('intersects restored tabs and last route with current routes and permissions', () => {
    const restored = userPreferencesCodec.decode({
      tabs: [
        { routeName: 'home', path: '/home', menuId: '0' },
        { routeName: 'settings', path: '/system/setting', menuId: '41' },
        { routeName: 'mail', path: '/system/mail', menuId: '42' },
        { routeName: 'stale', path: '/removed', menuId: '99' },
      ],
      selectedMenuId: '42',
      lastRoute: '/system/mail',
      tables: { users: { pageSize: 20 } },
      filters: { users: { status: 1 } },
    })

    expect(reconcileUserPreferences(restored, [
      { name: 'settings', path: '/system/setting', menuId: '41' },
      { name: 'mail', path: '/system/mail', menuId: '42', permission: 'system_mail' },
    ], new Set())).toEqual({
      tabs: [
        { routeName: 'home', path: '/home', menuId: '0' },
        { routeName: 'settings', path: '/system/setting', menuId: '41' },
      ],
      selectedMenuId: '0',
      lastRoute: '/home',
      tables: { users: { pageSize: 20 } },
      filters: { users: { status: 1 } },
    })
  })

  it('creates and reuses one validated device id through Persistence', () => {
    const persistence = new Persistence(new MemoryStorage())
    const createId = vi.fn(() => '8d4fc816-0eb7-4b72-a31f-25d8fb98c819')
    const provider = createDeviceIdProvider(persistence, createId)

    expect(provider.get()).toBe('8d4fc816-0eb7-4b72-a31f-25d8fb98c819')
    expect(provider.get()).toBe('8d4fc816-0eb7-4b72-a31f-25d8fb98c819')
    expect(createId).toHaveBeenCalledTimes(1)
  })
})
