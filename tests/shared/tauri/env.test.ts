import { describe, expect, it } from 'vitest'

const {
  isTauriRuntime,
  resolveDesktopPlatform,
  shouldUseNativeFromWindowState,
} = await import('../../../src/platform/tauri/env')

describe('tauri env helpers', () => {
  it('detects tauri runtime from the global tauri marker', () => {
    expect(isTauriRuntime({ __TAURI__: {} })).toBe(true)
    expect(isTauriRuntime({})).toBe(false)
  })

  it('maps user agent strings to the current desktop target format', () => {
    expect(resolveDesktopPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('windows-x86_64')
    expect(resolveDesktopPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe('darwin-x86_64')
  })

  it('uses native notifications when the tauri window is not foreground-visible', () => {
    expect(shouldUseNativeFromWindowState({ minimized: true, focused: true, visible: true })).toBe(true)
    expect(shouldUseNativeFromWindowState({ minimized: false, focused: false, visible: true })).toBe(true)
    expect(shouldUseNativeFromWindowState({ minimized: false, focused: true, visible: false })).toBe(true)
    expect(shouldUseNativeFromWindowState({ minimized: false, focused: true, visible: true })).toBe(false)
  })
})
