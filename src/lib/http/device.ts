import { deviceNamespace } from '@/modules/persistence/namespaces'
import { deviceIdentityCodec } from '@/modules/persistence/preferences'
import type { Persistence } from '@/modules/persistence/store'

const DEVICE_ID_KEY = 'identity'

export interface DeviceIdProvider {
  get(): string
}

function createUuid(): string {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    throw new Error('crypto.randomUUID is required to create a device identity')
  }
  return globalThis.crypto.randomUUID()
}

export function createDeviceIdProvider(
  persistence: Persistence,
  createId: () => string = createUuid,
): DeviceIdProvider {
  let cached: string | null = null
  return {
    get() {
      if (cached !== null) return cached
      const restored = persistence.read(deviceNamespace, DEVICE_ID_KEY, deviceIdentityCodec)
      if (restored) {
        cached = restored.deviceId
        return cached
      }
      const identity = deviceIdentityCodec.decode({ deviceId: createId() })
      persistence.write(deviceNamespace, DEVICE_ID_KEY, deviceIdentityCodec, identity)
      cached = identity.deviceId
      return cached
    },
  }
}

let installedProvider: DeviceIdProvider | null = null

export function installDeviceIdProvider(provider: DeviceIdProvider): void {
  installedProvider = provider
}

export function getDeviceId(): string {
  if (!installedProvider) throw new Error('device identity provider is not installed')
  return installedProvider.get()
}
