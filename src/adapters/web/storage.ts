import type { StorageAdapter } from '@/modules/persistence/store'

export function createWebStorageAdapter(storage: Storage): StorageAdapter {
  return {
    getItem(key) {
      return storage.getItem(key)
    },
    setItem(key, value) {
      storage.setItem(key, value)
    },
    removeItem(key) {
      storage.removeItem(key)
    },
    keys() {
      const keys: string[] = []
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index)
        if (key !== null) keys.push(key)
      }
      return keys
    },
  }
}

export function createBrowserLocalStorageAdapter(): StorageAdapter {
  return createWebStorageAdapter(window.localStorage)
}
