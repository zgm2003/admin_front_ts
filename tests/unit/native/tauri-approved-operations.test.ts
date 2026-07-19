import { beforeEach, describe, expect, it, vi } from 'vitest'

const invoke = vi.fn()
const check = vi.fn()

vi.mock('@tauri-apps/api/core', () => ({
  invoke,
  isTauri: vi.fn(() => true),
}))

vi.mock('@tauri-apps/plugin-updater', () => ({ check }))

import { createTauriNativeBridge } from '@/adapters/tauri/native-bridge'

function nativeUpdate(overrides: Record<string, unknown> = {}) {
  return {
    currentVersion: '1.0.7',
    version: '1.1.0',
    body: '安全更新',
    download: vi.fn(async (listener: (event: unknown) => void) => {
      listener({ event: 'Started', data: { contentLength: 4 } })
      listener({ event: 'Progress', data: { chunkLength: 4 } })
      listener({ event: 'Finished' })
    }),
    install: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
    ...overrides,
  }
}

describe('approved Tauri command adapter', () => {
  beforeEach(() => {
    invoke.mockReset()
    check.mockReset()
  })

  it('uses literal Rust commands for app version, window, notification, and process actions', async () => {
    invoke
      .mockResolvedValueOnce('1.0.7')
      .mockResolvedValueOnce({ minimized: false, maximized: true, focused: true, visible: true })
      .mockResolvedValue(undefined)
    const bridge = createTauriNativeBridge()

    await expect(bridge.updater.getCurrentVersion()).resolves.toBe('1.0.7')
    await expect(bridge.window.getState()).resolves.toEqual({
      minimized: false,
      maximized: true,
      focused: true,
      visible: true,
    })
    await bridge.window.minimize()
    await bridge.window.toggleMaximize()
    await bridge.window.hide()
    await bridge.window.requestClose()
    await bridge.notifications.send('新消息', '任务已完成')
    await bridge.process.relaunchAfterUpdate()
    await bridge.process.exitAfterUserConfirmation()

    expect(invoke.mock.calls).toEqual([
      ['get_app_version'],
      ['get_window_state'],
      ['minimize_window'],
      ['toggle_maximize_window'],
      ['hide_window'],
      ['request_window_close'],
      ['send_notification', { title: '新消息', body: '任务已完成' }],
      ['relaunch_app', { intent: 'update-installed' }],
      ['exit_app', { intent: 'user-confirmed-close' }],
    ])
  })

  it('enforces strict updater event order and download-before-install', async () => {
    const raw = nativeUpdate()
    check.mockResolvedValue(raw)
    const bridge = createTauriNativeBridge()
    const update = await bridge.updater.check()
    expect(update).not.toBeNull()
    if (!update) throw new Error('expected update')

    await expect(update.install()).rejects.toMatchObject({
      code: 'native.updater_state_invalid',
    })

    const events: unknown[] = []
    await update.download((event) => events.push(event))
    expect(events).toEqual([
      { event: 'Started', data: { contentLength: 4 } },
      { event: 'Progress', data: { chunkLength: 4 } },
      { event: 'Finished' },
    ])
    await expect(update.install()).resolves.toBeUndefined()
    expect(raw.download).toHaveBeenCalledTimes(1)
    expect(raw.install).toHaveBeenCalledTimes(1)
  })

  it('rejects malformed SemVer and malformed updater events', async () => {
    check.mockResolvedValueOnce(nativeUpdate({ version: '01.2.3' }))
    const bridge = createTauriNativeBridge()
    await expect(bridge.updater.check()).rejects.toMatchObject({
      code: 'native.updater_contract_invalid',
    })

    check.mockResolvedValueOnce(nativeUpdate({
      download: vi.fn(async (listener: (event: unknown) => void) => {
        listener({ event: 'Progress', data: { chunkLength: 1 } })
      }),
    }))
    const update = await bridge.updater.check()
    if (!update) throw new Error('expected update')
    await expect(update.download(() => undefined)).rejects.toMatchObject({
      code: 'native.updater_contract_invalid',
    })
  })

  it('maps the updater plugin nullable Option fields to documented optional values', async () => {
    const raw = nativeUpdate({
      body: null,
      download: vi.fn(async (listener: (event: unknown) => void) => {
        listener({ event: 'Started', data: { contentLength: null } })
        listener({ event: 'Finished' })
      }),
    })
    check.mockResolvedValueOnce(raw)
    const bridge = createTauriNativeBridge()
    const update = await bridge.updater.check()
    expect(update).not.toBeNull()
    if (!update) throw new Error('expected update')
    expect(update).not.toHaveProperty('body')

    const events: unknown[] = []
    await update.download((event) => events.push(event))
    expect(events).toEqual([
      { event: 'Started', data: {} },
      { event: 'Finished' },
    ])
  })

  it('redacts raw updater errors that may contain signed query values', async () => {
    check.mockRejectedValueOnce(new Error(
      'download failed: https://cos.zgm2003.cn/update.nsis.zip?signature=must-not-leak',
    ))
    const bridge = createTauriNativeBridge()

    const error = await bridge.updater.check().catch((reason: unknown) => reason)
    expect(error).toMatchObject({ code: 'native.updater_failed' })
    expect(String(error)).not.toContain('must-not-leak')
    expect(JSON.stringify(error)).not.toContain('must-not-leak')
  })
})
