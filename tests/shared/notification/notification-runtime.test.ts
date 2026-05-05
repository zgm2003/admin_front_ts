import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('notification runtime realtime contract', () => {
  it('shows every created notification event instead of filtering normal notices away', () => {
    const source = readFrontendSource('src/components/NotificationRuntime/src/index.vue')

    expect(source).toContain("onWsMessage<NotificationWsPayload>('notification.created.v1'")
    expect(source).not.toContain("data.level !== 'urgent'")
  })
})
