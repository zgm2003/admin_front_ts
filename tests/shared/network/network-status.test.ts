import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const hookSourcePath = fileURLToPath(new URL('../../../src/hooks/useNetworkStatus.ts', import.meta.url))
const noticeSourcePath = fileURLToPath(new URL('../../../src/components/NetworkStatusNotice/src/index.vue', import.meta.url))
const appSourcePath = fileURLToPath(new URL('../../../src/App.vue', import.meta.url))

describe('network status notice', () => {
  it('keeps network detection in a focused composable', async () => {
    const { readNavigatorOnline, shouldShowOfflineNotice } = await import('../../../src/hooks/useNetworkStatus')

    expect(readNavigatorOnline({ onLine: false })).toBe(false)
    expect(readNavigatorOnline({ onLine: true })).toBe(true)
    expect(readNavigatorOnline(null)).toBe(true)
    expect(shouldShowOfflineNotice(false)).toBe(true)
    expect(shouldShowOfflineNotice(true)).toBe(false)

    const source = readFileSync(hookSourcePath, 'utf8')
    expect(source).toContain("addEventListener('online'")
    expect(source).toContain("addEventListener('offline'")
    expect(source).toContain("removeEventListener('online'")
    expect(source).toContain("removeEventListener('offline'")
    expect(source).toContain('window.location.reload()')
  })

  it('renders the offline UI with Element Plus and a refresh action', () => {
    const source = readFileSync(noticeSourcePath, 'utf8')

    expect(source).toContain("import { useNetworkStatus } from '@/hooks/useNetworkStatus'")
    expect(source).toContain('<el-alert')
    expect(source).toContain('<el-button')
    expect(source).toContain('@click="refreshPage"')
    expect(source).toContain('role="status"')
    expect(source).toContain('aria-live="assertive"')
  })

  it('mounts the notice once at the app shell level', () => {
    const source = readFileSync(appSourcePath, 'utf8')

    expect(source).toContain("import { NetworkStatusNotice } from '@/components/NetworkStatusNotice'")
    expect(source).toContain('<NetworkStatusNotice />')
  })
})
