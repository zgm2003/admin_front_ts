import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('queue monitor api and page contract', () => {
  it('uses the authenticated official asynqmon mount instead of legacy queue monitor routes', () => {
    const source = readFrontendSource('src/api/system/queueMonitor.ts')

    expect(source).toContain("import { issueQueueMonitorGrant } from '@/api/auth/browserGrant'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain("export const ADMIN_QUEUE_MONITOR_UI_PATH = `${ADMIN_API_PREFIX}/queue-monitor-ui`")
    expect(source).toContain('export const ADMIN_QUEUE_MONITOR_UI_URL = buildQueueMonitorUIURL(import.meta.env.VITE_GO_API_BASE_URL)')
    expect(source).toContain('prepareQueueMonitorGrant')
    expect(source).toContain('return issueQueueMonitorGrant()')
    expect(source).toContain('new URL(ADMIN_QUEUE_MONITOR_UI_PATH')
    expect(source).not.toContain('service.head(')
    expect(source).not.toContain('legacyRequest')
    expect(source).not.toContain('/api/admin/QueueMonitor/')
    expect(source).not.toContain('QueueMonitorApi')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })

  it('keeps the queue monitor page as a thin asynqmon wrapper', () => {
    const source = readFrontendSource('src/views/Main/system/queueMonitor/index.vue')

    expect(source).toContain('ADMIN_QUEUE_MONITOR_UI_URL')
    expect(source).toContain('prepareQueueMonitorGrant')
    expect(source).toContain('await prepareQueueMonitorGrant()')
    expect(source).toContain('<iframe')
    expect(source).toContain('v-if="frameReady"')
    expect(source).not.toContain('finally {')
    expect(source).toContain('window.open(ADMIN_QUEUE_MONITOR_UI_URL')
    expect(source).toContain('min-height: 0')
    expect(source).toContain('calc(100dvh')
    expect(source).not.toContain('QueueMonitorApi.')
    expect(source).not.toContain('ElMessageBox')
    expect(source).not.toContain('handleRetry')
    expect(source).not.toContain('handleClear')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
