import { describe, expect, it } from 'vitest'
import { devicePreferencesCodec } from '@/modules/persistence/preferences'

describe('Browser-only device preferences', () => {
  it('uses codec version 2 and discards the historical desktop window state', () => {
    expect(devicePreferencesCodec.version).toBe(2)
    expect(devicePreferencesCodec.migrate?.(1, {
      theme: 'dark',
      language: 'en-US',
      desktopWindow: {
        maximized: true,
        closeAction: 'minimize',
      },
      rememberedLogin: {
        account: 'admin@example.test',
        type: 'password',
      },
    })).toEqual({
      theme: 'dark',
      language: 'en-US',
      rememberedLogin: {
        account: 'admin@example.test',
        type: 'password',
      },
    })
  })

  it('rejects unsupported migrations and new desktop-window aliases', () => {
    expect(devicePreferencesCodec.migrate?.(0, { theme: 'dark' })).toBeNull()
    expect(() => devicePreferencesCodec.decode({
      theme: 'dark',
      desktopWindow: { maximized: true },
    })).toThrow()
  })

  it('migrates sparse v1 preferences without inventing absent fields', () => {
    expect(devicePreferencesCodec.migrate?.(1, {})).toEqual({})
  })
})
