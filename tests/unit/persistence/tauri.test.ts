import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { deviceNamespace } from '@/modules/persistence/namespaces'
import {
  devicePreferencesCodec,
  readDevicePreferences,
} from '@/modules/persistence/preferences'
import { Persistence, type StorageAdapter } from '@/modules/persistence/store'
import { setupTauriStorePersistence, useTauriStore } from '@/store/tauri'

class MemoryStorage implements StorageAdapter {
  readonly values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
  keys() { return [...this.values.keys()] }
}

describe('Tauri device preferences', () => {
  it('restores and updates the close action without overwriting other device preferences', () => {
    const persistence = new Persistence(new MemoryStorage())
    persistence.write(deviceNamespace, 'preferences', devicePreferencesCodec, {
      theme: 'dark',
      desktopWindow: { closeAction: 'exit' },
    })
    const pinia = createPinia()

    setupTauriStorePersistence(pinia, persistence)
    const store = useTauriStore(pinia)
    expect(store.closeAction).toBe('exit')

    store.setCloseAction('minimize')
    expect(readDevicePreferences(persistence)).toEqual({
      theme: 'dark',
      desktopWindow: { closeAction: 'minimize' },
    })

    store.clearCloseAction()
    expect(readDevicePreferences(persistence)).toEqual({ theme: 'dark' })
  })
})
