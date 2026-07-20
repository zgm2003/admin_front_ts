import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('blocking containerized frontend quality gates', () => {
  it('defines one ordered, fail-closed verification script', () => {
    const packageJson = JSON.parse(read('package.json')) as {
      scripts?: Record<string, string>
    }
    const command = packageJson.scripts?.['verify:frontend'] ?? ''
    const required = [
      'npm run check:browser-only',
      'npm run contract:check',
      'npm run routes:check',
      'npm run locale:check',
      'npm run lint -- --max-warnings 0',
      'npm run lint:quality',
      'npm run typecheck',
      'npm test -- --coverage',
      'npm run build',
      'npm run bundle:check',
      'npm run test:architecture',
      'npm run audit:dependencies',
    ]
    let previous = -1
    for (const gate of required) {
      const index = command.indexOf(gate)
      expect(index, `${gate} must follow the preceding gate`).toBeGreaterThan(previous)
      previous = index
    }

    expect(packageJson.scripts?.['routes:check']).toContain('--check')
    expect(packageJson.scripts?.['audit:dependencies']).toContain('npm audit --omit=dev')
    expect(packageJson.scripts?.['audit:dependencies']).toContain('--audit-level=high')
    expect(command).not.toMatch(/lint:baseline|\|\|\s*true|;\s*exit\s+0/iu)
  })

  it('pins the Docker wrapper, cache volumes, lockfile install, and exit propagation', () => {
    const wrapper = read('scripts/docker-frontend-gate.ps1')

    expect(wrapper).toContain("'E:\\admin\\admin_front_ts'")
    expect(wrapper).toContain("'node:22.23.1-alpine'")
    expect(wrapper).toContain('npm ci --no-audit --no-fund')
    expect(wrapper).toContain('package-lock.json')
    expect(wrapper).toContain('admin-front-npm-cache')
    expect(wrapper).toContain('admin-front-node-modules')
    expect(wrapper).toContain("'--name', 'admin-front-quality-gate'")
    expect(wrapper).toContain('dst=/workspace')
    expect(wrapper).toContain("'--workdir', '/workspace'")
    expect(wrapper).toContain('$LASTEXITCODE')
    expect(wrapper).toMatch(/exit\s+\$exitCode/iu)
    expect(wrapper).not.toMatch(/--publish|['"]-p['"]|npm\s+run\s+(?:dev|preview)/iu)
  })

  it('keeps the host verifier as the single composition root and blocks dirty output', () => {
    const verifier = read('scripts/verify-frontend.ps1')

    expect(verifier).toContain('scripts\\docker-frontend-gate.ps1')
    expect(verifier).toContain("'npm run verify:frontend'")
    expect(verifier).toContain('git diff --check')
    expect(verifier).toContain('git diff --cached --check')
    expect(verifier).toContain('org.opencontainers.image.revision')
    expect(verifier).not.toContain('lint:baseline')
    expect(verifier).not.toMatch(/^\s*&?\s*npm(?:\.cmd)?\s/gmu)
  })

  it('keeps browser-only source and repository boundaries blocking', () => {
    const packageJson = read('package.json')
    const forbiddenBrowserTool = new RegExp(['play', 'wright'].join(''), 'iu')

    expect(existsSync(resolve(root, '.github'))).toBe(false)
    expect(existsSync(resolve(root, '.worktrees'))).toBe(false)
    expect(packageJson).not.toMatch(/@tauri-apps|\btauri\b|\bdesktop\b/iu)
    expect(packageJson).not.toMatch(forbiddenBrowserTool)
    for (const path of [
      'scripts/docker-frontend-gate.ps1',
      'scripts/verify-frontend.ps1',
    ]) {
      const source = read(path)
      expect(source).not.toMatch(forbiddenBrowserTool)
      expect(source).not.toMatch(/runtime\s+(?:mock|fallback)|\.github|workflow/iu)
    }
  })

  it('loads the COS source entry against an externally patched XML parser', () => {
    const packageJson = JSON.parse(read('package.json')) as {
      overrides?: Record<string, Record<string, string>>
    }
    const uploadClient = read('src/lib/upload/uploadClient.ts')

    expect(packageJson.overrides?.['cos-js-sdk-v5']?.['fast-xml-parser']).toMatch(/^5\./u)
    expect(uploadClient).toContain("import('cos-js-sdk-v5/index.js')")
    expect(uploadClient).not.toContain("import('cos-js-sdk-v5')")
  })
})
