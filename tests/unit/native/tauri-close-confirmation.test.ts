import { createPinia } from 'pinia'
import { afterEach, describe, expect, it } from 'vitest'
import { installNativeBridge } from '@/adapters/native'
import { createWebNativeBridge } from '@/adapters/web/native-bridge'
import type { NativeBridge, NativeUnlisten } from '@/modules/native/types'
import { useTauriStore } from '@/store/tauri'

const restorers: Array<() => void> = []

afterEach(() => {
  restorers.splice(0).reverse().forEach((restore) => restore())
})

describe('Tauri close confirmation', () => {
  it('always asks for confirmation when the trusted tray exit event is received', async () => {
    let exitRequested: (() => void) | undefined
    const web = createWebNativeBridge({ origin: 'https://www.zgm2003.cn' })
    const bridge = {
      ...web,
      kind: 'tauri',
      window: {
        ...web.window,
        async listenExitRequested(listener: () => void): Promise<NativeUnlisten> {
          exitRequested = listener
          return () => undefined
        },
      },
      updater: {
        ...web.updater,
        async getCurrentVersion() {
          return '1.0.7'
        },
      },
    } as NativeBridge
    restorers.push(installNativeBridge(bridge))

    const store = useTauriStore(createPinia())
    store.setCloseAction('minimize')
    store.rememberChoice = true
    await store.init()

    expect(exitRequested).toBeTypeOf('function')
    exitRequested?.()

    expect(store.showCloseDialog).toBe(true)
    expect(store.rememberChoice).toBe(false)
    expect(store.closeAction).toBe('minimize')
  })
})
