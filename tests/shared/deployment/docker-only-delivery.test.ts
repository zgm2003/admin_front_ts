import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(process.cwd())

function read(root: string, path: string): string {
  return readFileSync(resolve(root, path), 'utf8')
}

describe('Docker-only frontend delivery', () => {
  it('keeps the frontend checkout free of deployment workflows and nested worktrees', () => {
    expect(existsSync(resolve(frontendRoot, '.github'))).toBe(false)
    expect(existsSync(resolve(frontendRoot, '.worktrees'))).toBe(false)
    expect(read(frontendRoot, '.gitignore')).not.toMatch(/(^|\r?\n)\.worktrees\/?(\r?\n|$)/)
    expect(read(frontendRoot, '.dockerignore')).not.toMatch(/(^|\r?\n)\.worktrees\/?(\r?\n|$)/)
  })

  it('runs source gates before one revision-labelled Docker image build', () => {
    const verifier = read(frontendRoot, 'scripts/verify-frontend.ps1')
    const wrapper = read(frontendRoot, 'scripts/docker-frontend-gate.ps1')
    const commands = [
      'git diff --check',
      'git diff --cached --check',
      "'npm run verify:frontend'",
      "@('build'",
      "@('image', 'inspect'",
    ]
    let previous = -1
    for (const command of commands) {
      const index = verifier.indexOf(command)
      expect(index, `${command} must follow the preceding verification gate`).toBeGreaterThan(previous)
      previous = index
    }

    expect(wrapper).toContain('node:22.23.1-alpine')
    expect(verifier).toContain('scripts\\docker-frontend-gate.ps1')
    expect(wrapper).toContain('admin-front-node-modules')
    expect(wrapper).toContain('admin-front-npm-cache')
    expect(wrapper).toContain('npm ci --no-audit --no-fund')
    expect(verifier).not.toMatch(/^\s*&?\s*npm(?:\.cmd)?\s/gmu)
    expect(verifier).toContain('BUILD_REVISION=$GitSha')
    expect(verifier).toContain("[string]$ImageName = 'admin-frontend'")
    expect(verifier).toContain('$imageTag = "${ImageName}:$GitSha"')
    expect(verifier).toContain('org.opencontainers.image.revision')
    expect(verifier).toContain('127.0.0.1:8080/healthz')
    expect(verifier).not.toMatch(/package-web-artifact|dist\.tar|scp\s/i)
  })
})
