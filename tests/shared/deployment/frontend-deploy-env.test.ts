import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('frontend production endpoints', () => {
  it('keeps repository production env aligned with current production domains', () => {
    const env = readFrontendSource('.env.production')

    expect(env).toContain('VITE_GO_API_BASE_URL=https://www.zgm2003.cn')
    expect(env).toContain('VITE_WEB_SOCKET_URL=wss://www.zgm2003.cn/api/admin/v1/realtime/ws')
    expect(env).not.toContain('api.example.com')
    expect(env).not.toContain('admin.example.com')
  })
})
