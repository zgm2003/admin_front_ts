import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(process.cwd())
const backendRoot = resolve(frontendRoot, '..', 'admin_back_go')

function read(root: string, path: string): string {
  return readFileSync(resolve(root, path), 'utf8')
}

function registeredWorktrees(root: string): string[] {
  const result = spawnSync('git', ['worktree', 'list', '--porcelain'], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  })
  if (result.status !== 0) throw new Error(result.stderr)
  return result.stdout
    .split(/\r?\n/)
    .filter((line) => line.startsWith('worktree '))
}

describe('Docker-only frontend delivery', () => {
  it('keeps both repositories on one checkout without GitHub workflow directories', () => {
    for (const root of [frontendRoot, backendRoot]) {
      expect(existsSync(resolve(root, '.github'))).toBe(false)
      expect(existsSync(resolve(root, '.worktrees'))).toBe(false)
      expect(registeredWorktrees(root)).toHaveLength(1)
      expect(read(root, '.gitignore')).not.toMatch(/(^|\r?\n)\.worktrees\/?(\r?\n|$)/)
    }
    expect(read(frontendRoot, '.dockerignore')).not.toMatch(/(^|\r?\n)\.worktrees\/?(\r?\n|$)/)
  })

  it('runs source gates before one revision-labelled Docker image build', () => {
    const verifier = read(frontendRoot, 'scripts/verify-frontend.ps1')
    const commands = [
      'npm ci',
      'npm run contract:check',
      'npm run routes:generate',
      'npm run lint:baseline',
      'npm run typecheck',
      'npm test -- --coverage',
      "@('build'",
      "@('image', 'inspect'",
    ]
    let previous = -1
    for (const command of commands) {
      const index = verifier.indexOf(command)
      expect(index, `${command} must follow the preceding verification gate`).toBeGreaterThan(previous)
      previous = index
    }

    expect(verifier).toContain('BUILD_REVISION=$GitSha')
    expect(verifier).toContain("[string]$ImageName = 'admin-frontend'")
    expect(verifier).toContain('$imageTag = "${ImageName}:$GitSha"')
    expect(verifier).toContain('org.opencontainers.image.revision')
    expect(verifier).toContain('127.0.0.1:8080/healthz')
    expect(verifier).not.toContain('npm run build')
    expect(verifier).not.toMatch(/package-web-artifact|dist\.tar|scp\s/i)
  })

  it('keeps integrated startup in the backend Compose lifecycle', () => {
    const dockerfile = read(frontendRoot, 'Dockerfile')
    const compose = read(backendRoot, 'deploy/docker-first/docker-compose.yml')
    const lifecycle = read(backendRoot, 'scripts/docker-platform.ps1')
    const readme = read(frontendRoot, 'README.md')

    expect(dockerfile).toContain('RUN npm run build:check')
    expect(dockerfile).toContain('LABEL org.opencontainers.image.revision="${BUILD_REVISION}"')
    expect(dockerfile).toContain('nginxinc/nginx-unprivileged')
    expect(compose).toContain('context: ../../../admin_front_ts')
    expect(compose).toContain('VITE_ADMIN_RUNTIME_MODE: development')
    expect(lifecycle).toContain("Invoke-Docker @('compose', '-f', $appCompose, 'build', 'admin-api', 'frontend')")
    expect(lifecycle).toContain("Invoke-Docker @('compose', '-f', $appCompose, 'up', '-d', '--no-build'")
    expect(lifecycle).not.toMatch(/npm run dev|vite\s|go run/)
    expect(readme).toContain('pwsh -NoProfile -File scripts/docker-platform.ps1 up')
    expect(readme).not.toContain('GitHub Actions 生产构建')
  })
})
