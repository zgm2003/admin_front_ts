import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const invoke = vi.fn()
const listen = vi.fn()
const check = vi.fn()

vi.mock('@tauri-apps/api/core', () => ({
  invoke,
  isTauri: vi.fn(() => true),
}))

vi.mock('@tauri-apps/api/event', () => ({ listen }))
vi.mock('@tauri-apps/plugin-updater', () => ({ check }))

import { createTauriNativeBridge } from '@/adapters/tauri/native-bridge'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('NativeBridge lifecycle and denial boundary', () => {
  beforeEach(() => {
    invoke.mockReset()
    listen.mockReset()
    check.mockReset()
  })

  it('disposes every native event listener exactly once even when disposal repeats', async () => {
    const unlisteners = Array.from({ length: 6 }, () => vi.fn())
    for (const unlisten of unlisteners) listen.mockResolvedValueOnce(unlisten)
    const bridge = createTauriNativeBridge()

    await bridge.window.listenResize(() => undefined)
    await bridge.window.listenCloseRequested(() => undefined)
    await bridge.window.listenExitRequested(() => undefined)
    await bridge.downloads.listenProgress(() => undefined)
    await bridge.downloads.listenCompleted(() => undefined)
    await bridge.downloads.listenFailed(() => undefined)

    await Promise.all([bridge.dispose(), bridge.dispose()])
    for (const unlisten of unlisteners) expect(unlisten).toHaveBeenCalledTimes(1)
  })

  it('closes an unused updater resource during bridge disposal', async () => {
    const close = vi.fn(async () => undefined)
    check.mockResolvedValueOnce({
      currentVersion: '1.0.7',
      version: '1.1.0',
      body: null,
      download: vi.fn(),
      install: vi.fn(),
      close,
    })
    const bridge = createTauriNativeBridge()
    await expect(bridge.updater.check()).resolves.not.toBeNull()

    await Promise.all([bridge.dispose(), bridge.dispose()])
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('keeps every custom Rust command behind exact local-main-window authorization', async () => {
    const [lib, windowBoundary, notificationBoundary, processBoundary] = await Promise.all([
      readFile(resolve(repositoryRoot, 'src-tauri/src/lib.rs'), 'utf8'),
      readFile(resolve(repositoryRoot, 'src-tauri/src/window.rs'), 'utf8'),
      readFile(resolve(repositoryRoot, 'src-tauri/src/notification.rs'), 'utf8'),
      readFile(resolve(repositoryRoot, 'src-tauri/src/process.rs'), 'utf8'),
    ])

    const commandPattern = /#\[tauri::command\][\s\S]*?fn\s+([a-z0-9_]+)\s*\(([\s\S]*?)\)\s*->\s*Result[\s\S]*?\n}/g
    const commandBodies = [lib, windowBoundary, notificationBoundary, processBoundary]
      .flatMap((source) => [...source.matchAll(commandPattern)])
    const unguarded = commandBodies
      .filter((match) => !match[2]?.includes('WebviewWindow') || !match[0].includes('ensure_main_window'))
      .map((match) => match[1])

    expect(unguarded).toEqual([])
    expect(windowBoundary).toContain('is_authorized_window_url')
    expect(windowBoundary).toContain('tauri.localhost')
    expect(windowBoundary.split('#[cfg(test)]')[0]).not.toContain('www.zgm2003.cn')
  })
})
