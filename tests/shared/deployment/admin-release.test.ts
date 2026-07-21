import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())

function repositoryPaths(directory = root, prefix = ''): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', 'coverage', 'dist'].includes(entry.name)) return []
      return repositoryPaths(resolve(directory, entry.name), path)
    }
    return entry.isFile() ? [path] : []
  })
}

describe('Admin release frontend boundary', () => {
  it('ships only the Browser Docker unit with no deployment workflow or desktop artifact', () => {
    const paths = repositoryPaths()

    expect(existsSync(resolve(root, '.github'))).toBe(false)
    expect(existsSync(resolve(root, '.worktrees'))).toBe(false)
    expect(paths.filter((path) => /(^|\/)\.github\/|(^|\/)workflows?\//iu.test(path))).toEqual([])
    expect(paths.filter((path) => (
      /(^|\/)src-tauri(\/|$)|(^|\/)Cargo\.(?:toml|lock)$|(^|\/)rust-toolchain(?:\.toml)?$|(^|\/)tauri\.conf\.json$|(^|\/)updater(\/|$)/iu.test(path)
    ))).toEqual([])
  })

  it('has no versioned Web shell or client-version runtime switch', () => {
    const productionPaths = repositoryPaths().filter((path) => (
      path === 'package.json'
      || path === 'Dockerfile'
      || path.startsWith('src/')
      || path.startsWith('deploy/')
    ))
    const violations = productionPaths.flatMap((path) => {
      const source = readFileSync(resolve(root, path), 'utf8')
      return /VITE_ADMIN_CLIENT_VARIANT|X-Admin-Client-Variant|client[_-]?versions?|versioned[_-]?web|desktop[_-]?shell/iu.test(source)
        ? [path]
        : []
    })

    expect(violations).toEqual([])
  })
})
