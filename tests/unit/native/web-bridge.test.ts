import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, it, vi } from 'vitest'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const modulePath = resolve(repositoryRoot, 'src/adapters/web/native-bridge.ts')

async function loadBridgeModule() {
  expect(existsSync(modulePath), 'web NativeBridge adapter must exist').toBe(true)
  return import(pathToFileURL(modulePath).href)
}

describe('web NativeBridge', () => {
  it('provides deterministic browser-safe window behavior', async () => {
    const { createWebNativeBridge } = await loadBridgeModule()
    const open = vi.fn()
    const bridge = createWebNativeBridge({
      origin: 'https://www.zgm2003.cn',
      open,
    })

    expect(bridge.kind).toBe('web')
    await expect(bridge.window.getState()).resolves.toEqual({
      minimized: false,
      maximized: false,
      focused: true,
      visible: true,
    })
    await expect(bridge.window.minimize()).resolves.toBeUndefined()
    await expect(bridge.window.hide()).resolves.toBeUndefined()
    await expect(bridge.window.requestClose()).resolves.toBeUndefined()
  })

  it('opens only allowlisted HTTPS external URLs with opener isolation', async () => {
    const { createWebNativeBridge, NativePolicyError } = await loadBridgeModule()
    const open = vi.fn(() => ({ opener: {} }) as unknown as Window)
    const bridge = createWebNativeBridge({
      origin: 'https://www.zgm2003.cn',
      open,
    })

    bridge.window.openExternal('https://cos.zgm2003.cn/releases/admin.exe')
    expect(open).toHaveBeenCalledWith(
      'https://cos.zgm2003.cn/releases/admin.exe',
      '_blank',
      'noopener,noreferrer',
    )
    expect(open.mock.results[0]?.value.opener).toBeNull()

    expect(() => bridge.window.openExternal('http://cos.zgm2003.cn/admin.exe'))
      .toThrow(NativePolicyError)
    expect(() => bridge.window.openExternal('https://evil.example/admin.exe'))
      .toThrow(NativePolicyError)
    expect(() => bridge.window.openExternal('javascript:alert(1)'))
      .toThrow(NativePolicyError)
  })

  it('allows same-origin paths but rejects credentials and cross-origin input', async () => {
    const { createWebNativeBridge, NativePolicyError } = await loadBridgeModule()
    const open = vi.fn(() => null)
    const bridge = createWebNativeBridge({
      origin: 'https://www.zgm2003.cn',
      open,
    })

    bridge.window.openSameOrigin('/api/admin/v1/queue-monitor-ui')
    expect(open).toHaveBeenCalledWith(
      'https://www.zgm2003.cn/api/admin/v1/queue-monitor-ui',
      '_blank',
      'noopener,noreferrer',
    )
    expect(() => bridge.window.openSameOrigin('https://evil.example/path')).toThrow(NativePolicyError)
    expect(() => bridge.window.openSameOrigin('https://user:pass@www.zgm2003.cn/path'))
      .toThrow(NativePolicyError)
  })

  it('returns typed unavailability for desktop-only operations', async () => {
    const { createWebNativeBridge, NativeUnavailableError } = await loadBridgeModule()
    const bridge = createWebNativeBridge({
      origin: 'https://www.zgm2003.cn',
      open: vi.fn(),
    })

    await expect(bridge.updater.getCurrentVersion()).rejects.toBeInstanceOf(NativeUnavailableError)
    await expect(bridge.credentials.clear()).rejects.toBeInstanceOf(NativeUnavailableError)
    await expect(bridge.downloads.getAll()).resolves.toEqual([])
    await expect(bridge.dispose()).resolves.toBeUndefined()
  })
})
