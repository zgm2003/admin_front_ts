import {
  NativePolicyError,
  NativeUnavailableError,
  type NativeBridge,
  type NativeUnlisten,
} from '@/modules/native/types'

export { NativePolicyError, NativeUnavailableError } from '@/modules/native/types'

const externalHosts = new Set(['www.zgm2003.cn', 'cos.zgm2003.cn'])
const noOpUnlisten: NativeUnlisten = () => undefined

type OpenWindow = (url?: string | URL, target?: string, features?: string) => Window | null
type NavigateWindow = (url: string) => void

export interface WebNativeBridgeOptions {
  readonly origin?: string
  readonly open?: OpenWindow
  readonly navigate?: NavigateWindow
}

function unavailable(operation: string): Promise<never> {
  return Promise.reject(new NativeUnavailableError(operation))
}

function parsedUrl(input: string, base?: string): URL {
  let url: URL
  try {
    url = base ? new URL(input, base) : new URL(input)
  } catch {
    throw new NativePolicyError('URL is invalid')
  }
  if (url.username || url.password) {
    throw new NativePolicyError('URL credentials are forbidden')
  }
  return url
}

function isolatedOpen(open: OpenWindow, url: URL): void {
  const opened = open(url.href, '_blank', 'noopener,noreferrer')
  if (opened) {
    try {
      opened.opener = null
    } catch {
      // Browser isolation flags already apply when opener is not assignable.
    }
  }
}

export function createWebNativeBridge(options: WebNativeBridgeOptions = {}): NativeBridge {
  const origin = options.origin ?? globalThis.location?.origin ?? 'https://www.zgm2003.cn'
  const open: OpenWindow = options.open
    ?? (typeof globalThis.open === 'function' ? globalThis.open.bind(globalThis) : () => null)
  const navigate: NavigateWindow = options.navigate
    ?? ((url) => globalThis.location?.assign(url))

  return {
    kind: 'web',
    window: {
      async getState() {
        return { minimized: false, maximized: false, focused: true, visible: true }
      },
      async minimize() {},
      async toggleMaximize() {},
      async hide() {},
      async requestClose() {},
      async listenResize() {
        return noOpUnlisten
      },
      async listenCloseRequested() {
        return noOpUnlisten
      },
      openExternal(input) {
        const url = parsedUrl(input)
        if (url.protocol !== 'https:' || !externalHosts.has(url.hostname.toLowerCase())) {
          throw new NativePolicyError('external URL is not allowlisted')
        }
        isolatedOpen(open, url)
      },
      navigateExternal(input) {
        if (input.length > 4_096) throw new NativePolicyError('external URL is too long')
        const url = parsedUrl(input)
        if (url.protocol !== 'https:') {
          throw new NativePolicyError('external navigation requires HTTPS')
        }
        navigate(url.href)
      },
      openSameOrigin(input) {
        const base = parsedUrl(origin)
        const url = parsedUrl(input, base.href)
        if (url.origin !== base.origin) {
          throw new NativePolicyError('URL must remain on the current origin')
        }
        isolatedOpen(open, url)
      },
    },
    updater: {
      getCurrentVersion: () => unavailable('updater.getCurrentVersion'),
      check: () => unavailable('updater.check'),
    },
    notifications: {
      async shouldUseNative() {
        return false
      },
      send: () => unavailable('notifications.send'),
    },
    credentials: {
      seal: () => unavailable('credentials.seal'),
      refresh: () => unavailable('credentials.refresh'),
      clear: () => unavailable('credentials.clear'),
    },
    downloads: {
      start: () => unavailable('downloads.start'),
      cancel: () => unavailable('downloads.cancel'),
      async getProgress() {
        return null
      },
      async getAll() {
        return []
      },
      remove: () => unavailable('downloads.remove'),
      reveal: () => unavailable('downloads.reveal'),
      async listenProgress() {
        return noOpUnlisten
      },
      async listenCompleted() {
        return noOpUnlisten
      },
      async listenFailed() {
        return noOpUnlisten
      },
    },
    process: {
      relaunchAfterUpdate: () => unavailable('process.relaunchAfterUpdate'),
      exitAfterUserConfirmation: () => unavailable('process.exitAfterUserConfirmation'),
    },
    async dispose() {},
  }
}
