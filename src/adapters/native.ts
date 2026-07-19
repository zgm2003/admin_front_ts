import { createWebNativeBridge } from '@/adapters/web/native-bridge'
import type { NativeBridge } from '@/modules/native/types'

const webBridge: NativeBridge = createWebNativeBridge()

export function getNativeBridge(): NativeBridge {
  return webBridge
}
