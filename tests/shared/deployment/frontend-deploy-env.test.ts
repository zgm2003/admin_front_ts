import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('frontend production deploy env', () => {
  it('keeps repository production env aligned with current production domains', () => {
    const env = readFrontendSource('.env.production')

    expect(env).toContain('VITE_GO_API_BASE_URL=https://www.zgm2003.cn')
    expect(env).toContain('VITE_WEB_SOCKET_URL=wss://www.zgm2003.cn/api/admin/v1/realtime/ws')
    expect(env).not.toContain('api.example.com')
    expect(env).not.toContain('admin.example.com')
  })

  it('uses GitHub Actions runtime endpoints first and falls back to repository production defaults', () => {
    const workflow = readFrontendSource('.github/workflows/deploy-admin-front.yml')

    expect(workflow).toContain('VITE_GO_API_BASE_URL: ${{ secrets.VITE_GO_API_BASE_URL || vars.VITE_GO_API_BASE_URL }}')
    expect(workflow).toContain('VITE_WEB_SOCKET_URL: ${{ secrets.VITE_WEB_SOCKET_URL || vars.VITE_WEB_SOCKET_URL }}')
    expect(workflow).toContain('load_production_default VITE_GO_API_BASE_URL')
    expect(workflow).toContain('load_production_default VITE_WEB_SOCKET_URL')
    expect(workflow).toContain('current="$(printenv "$key" || true)"')
    expect(workflow).not.toContain('${!key:-}')
    expect(workflow).toContain(': "${VITE_GO_API_BASE_URL:?VITE_GO_API_BASE_URL GitHub secret/variable or .env.production value is required}"')
    expect(workflow).toContain(': "${VITE_WEB_SOCKET_URL:?VITE_WEB_SOCKET_URL GitHub secret/variable or .env.production value is required}"')
    expect(workflow).not.toContain('www.zgm2003.cn')
    expect(workflow).not.toContain('zgm2003.cn')
  })

  it('keeps disabled legacy deploy workflow from deriving API or WebSocket origin from frontend domain', () => {
    const workflow = readFrontendSource('.github/workflows/deploy-frontend.yml.disabled')

    expect(workflow).not.toContain('API_BASE_URL="${VITE_GO_API_BASE_URL:-https://${FRONTEND_DOMAIN}}"')
    expect(workflow).not.toContain('WS_URL="${VITE_WEB_SOCKET_URL:-wss://${FRONTEND_DOMAIN}/api/admin/v1/realtime/ws}"')
    expect(workflow).toContain(': "${VITE_GO_API_BASE_URL:?VITE_GO_API_BASE_URL secret is required}"')
    expect(workflow).toContain(': "${VITE_WEB_SOCKET_URL:?VITE_WEB_SOCKET_URL secret is required}"')
  })

  it('keeps Tauri CSP from allowing the root frontend domain as a WebSocket endpoint', () => {
    const tauriConfig = readFrontendSource('src-tauri/tauri.conf.json')

    expect(tauriConfig).toContain('wss://www.zgm2003.cn')
    expect(tauriConfig).not.toMatch(/\bwss:\/\/zgm2003\.cn(?:\s|[";])/)
  })
})
