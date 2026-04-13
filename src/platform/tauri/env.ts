export interface TauriWindowState {
  minimized: boolean
  focused: boolean
  visible: boolean
}

export function isTauriRuntime(runtime: { __TAURI__?: unknown } | undefined | null = globalThis as typeof globalThis & { __TAURI__?: unknown }) {
  return Boolean(runtime?.__TAURI__)
}

export function isTauri() {
  return isTauriRuntime(globalThis as typeof globalThis & { __TAURI__?: unknown })
}

export function resolveDesktopPlatform(userAgent = navigator.userAgent) {
  const normalized = userAgent.toLowerCase()
  return normalized.includes('mac') ? 'darwin-x86_64' : 'windows-x86_64'
}

export function shouldUseNativeFromWindowState(state: TauriWindowState) {
  return state.minimized || !state.focused || !state.visible
}
