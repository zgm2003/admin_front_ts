import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())
const scriptPath = resolve(root, 'scripts/verify-docker-runtime.ps1')

function source(): string {
  expect(existsSync(scriptPath), 'Docker runtime verifier must exist').toBe(true)
  return readFileSync(scriptPath, 'utf8')
}

describe('Docker runtime acceptance boundary', () => {
  it('uses only the shared Docker platform and requires all five healthy containers', () => {
    const verifier = source()

    expect(verifier).toContain('E:\\admin\\admin_back_go\\scripts\\docker-platform.ps1')
    expect(verifier).toMatch(/-Action\s+['"]?status['"]?/u)
    for (const container of [
      'admin-state-mysql-1',
      'admin-state-redis-1',
      'admin-app-admin-api-1',
      'admin-app-admin-worker-1',
      'admin-app-frontend-1',
    ]) {
      expect(verifier).toContain(container)
    }
    expect(verifier).toContain('.State.Health.Status')
    expect(verifier).toContain("'healthy'")
  })

  it('checks health, exact revisions, Browser-only retirement, authenticated HTTP, and realtime', () => {
    const verifier = source()

    for (const endpoint of ['/healthz', '/health', '/ready']) {
      expect(verifier).toContain(endpoint)
    }
    expect(verifier).toContain('org.opencontainers.image.revision')
    expect(verifier).toContain('rev-parse')
    expect(verifier).toContain('npm run check:browser-only')
    expect(verifier).toContain('node:22.23.1-alpine')

    expect(verifier).toContain('/api/admin/v1/auth/login')
    expect(verifier).toContain("login_type = 'password'")
    expect(verifier).toContain('login_account = $account')
    expect(verifier).toContain('password = $password')
    expect(verifier).toContain('/api/admin/v1/users/me')
    expect(verifier).toContain('/api/admin/v1/auth/realtime-tickets')
    expect(verifier).toContain('/api/admin/v1/realtime/ws?ticket=')
    expect(verifier).toContain("'realtime.connected.v1'")
    expect(verifier).toContain("'realtime.pong.v1'")
  })

  it('takes credentials only from environment variables and never exposes secrets', () => {
    const verifier = source()

    expect(verifier).toContain('$env:ADMIN_SMOKE_ACCOUNT')
    expect(verifier).toContain('$env:ADMIN_SMOKE_PASSWORD')
    expect(verifier).toContain('ADMIN_SMOKE_CREDENTIALS_REQUIRED')
    expect(verifier).toContain('Assert-NoSecretLikeOutput')
    const topLevelParameters = verifier.match(
      /param\(([\s\S]*?)\)\s*\r?\n\s*\$ErrorActionPreference/u,
    )?.[1] ?? ''
    expect(topLevelParameters).not.toMatch(/\$(?:Account|Password)\b/iu)
    expect(verifier).not.toMatch(/ADMIN_SMOKE_(?:ACCOUNT|PASSWORD)\s*=\s*['"][^'"]+['"]/iu)
    expect(verifier).not.toMatch(/Write-(?:Output|Host)[^\r\n]*(?:\$password|\$accessToken|\$ticket)/iu)
  })

  it('rejects host runtimes, browser automation, and service-specific startup', () => {
    const verifier = source()
    for (const forbidden of [
      /npm\s+run\s+dev/iu,
      /\bvite(?:\.cmd)?\b/iu,
      /\bgo\s+run\b/iu,
      /\bStart-Process\b/iu,
      /\bmysqld(?:\.exe)?\b/iu,
      /\bredis-server(?:\.exe)?\b/iu,
      /playwright/iu,
    ]) {
      expect(verifier).not.toMatch(forbidden)
    }
  })
})
