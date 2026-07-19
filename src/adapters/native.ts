import { createWebNativeBridge } from '@/adapters/web/native-bridge'
import type { NativeBridge } from '@/modules/native/types'

export { NativeUpdaterError } from '@/modules/native/types'

export type {
  DesktopRefreshCredential,
  ManagedDownloadProgress,
  NativeBridge,
  NativeUpdate,
  NativeWindowState,
  UpdaterDownloadEvent,
} from '@/modules/native/types'

let installedBridge: NativeBridge = createWebNativeBridge()

export async function createRuntimeNativeBridge(): Promise<NativeBridge> {
  const adapter = await import('@/adapters/tauri/native-bridge')
  return await adapter.isTauriRuntime()
    ? adapter.createTauriNativeBridge()
    : createWebNativeBridge()
}

export function installNativeBridge(bridge: NativeBridge): () => void {
  const previous = installedBridge
  installedBridge = bridge
  return () => {
    if (installedBridge === bridge) installedBridge = previous
  }
}

export function getNativeBridge(): NativeBridge {
  return installedBridge
}
