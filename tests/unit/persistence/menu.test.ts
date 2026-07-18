import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { deviceNamespace } from '@/modules/persistence/namespaces'
import { Persistence, type StorageAdapter } from '@/modules/persistence/store'
import { menuUiPreferencesCodec } from '@/modules/persistence/preferences'
import { setupMenuStorePersistence, useMenuStore } from '@/store/menu'

class MemoryStorage implements StorageAdapter {
  readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  keys(): readonly string[] {
    return [...this.values.keys()]
  }
}

describe('menu Persistence integration', () => {
  it('restores validated device UI preferences before subscribing', () => {
    const storage = new MemoryStorage()
    const persistence = new Persistence(storage)
    persistence.write(deviceNamespace, 'menu-ui', menuUiPreferencesCodec, {
      systemColor: '#112233',
      breadcrumb: false,
      hamburger: false,
      tabtag: false,
      uniqueOpen: false,
      footer: false,
      pageTransition: false,
      transitionName: 'zoom',
      layoutMode: 'double',
    })
    const pinia = createPinia()

    setupMenuStorePersistence(pinia, persistence)

    expect(useMenuStore(pinia).$state).toMatchObject({
      selectedMenu: '0',
      tabList: [expect.objectContaining({ index: '0', path: '/home' })],
      systemColor: '#112233',
      breadcrumb: false,
      hamburger: false,
      tabtag: false,
      uniqueOpen: false,
      footer: false,
      pageTransition: false,
      transitionName: 'zoom',
      layoutMode: 'double',
    })
  })

  it('persists only device UI preferences and never tabs or selected menu', () => {
    const storage = new MemoryStorage()
    const persistence = new Persistence(storage)
    const pinia = createPinia()
    setupMenuStorePersistence(pinia, persistence)
    const menu = useMenuStore(pinia)

    menu.selectedMenu = '41'
    menu.changeSystemColor('#334455')

    expect(persistence.read(deviceNamespace, 'menu-ui', menuUiPreferencesCodec)).toMatchObject({
      systemColor: '#334455',
    })
    const raw = storage.values.get('admin:1:device:menu-ui') ?? ''
    expect(raw).not.toContain('selectedMenu')
    expect(raw).not.toContain('tabList')
  })
})
