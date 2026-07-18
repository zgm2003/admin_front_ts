import { afterEach, vi } from 'vitest'

afterEach(() => {
  document.body.replaceChildren()
  globalThis.localStorage?.clear()
  globalThis.sessionStorage?.clear()
  vi.restoreAllMocks()
  vi.useRealTimers()
})
