import { readFile, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

async function readJson(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(resolve(repositoryRoot, path), 'utf8')) as Record<string, unknown>
}

async function source(path: string): Promise<string> {
  return readFile(resolve(repositoryRoot, path), 'utf8')
}

async function rustCommandNames(): Promise<string[]> {
  const sourceRoot = resolve(repositoryRoot, 'src-tauri/src')
  const rustFiles: string[] = []

  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true })
    for (const entry of entries) {
      const path = resolve(directory, entry.name)
      if (entry.isDirectory()) {
        await visit(path)
      } else if (entry.isFile() && entry.name.endsWith('.rs')) {
        rustFiles.push(path)
      }
    }
  }

  await visit(sourceRoot)
  const commands = new Set<string>()
  const commandPattern = /#\s*\[\s*tauri::command(?:\([^\]]*\))?\s*\]\s*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+([a-z][a-z0-9_]*)/g
  for (const path of rustFiles) {
    const rust = await readFile(path, 'utf8')
    for (const match of rust.matchAll(commandPattern)) {
      commands.add(match[1]!)
    }
  }

  return [...commands].sort()
}

describe('Tauri local UI security configuration', () => {
  it('packages only the local dist and disables the global Tauri object', async () => {
    const config = await readJson('src-tauri/tauri.conf.json')
    const build = config.build as Record<string, unknown>
    const app = config.app as Record<string, unknown>
    const windows = app.windows as Array<Record<string, unknown>>

    expect(build.frontendDist).toBe('../dist')
    expect(app.withGlobalTauri).toBe(false)
    expect(windows).toHaveLength(1)
    expect(windows[0]?.label).toBe('main')
    expect(windows[0]?.create).toBe(false)
  })

  it('uses the measured CSP without script eval, script inline, or wildcard sources', async () => {
    const config = await readJson('src-tauri/tauri.conf.json')
    const app = config.app as Record<string, unknown>
    const security = app.security as Record<string, unknown>
    const csp = String(security.csp)

    expect(csp).toBe([
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://www.zgm2003.cn https://cos.zgm2003.cn",
      "font-src 'self' data:",
      "connect-src 'self' https://www.zgm2003.cn https://cos.zgm2003.cn wss://www.zgm2003.cn",
      'frame-src https://www.zgm2003.cn',
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ') + ';')
    expect(csp).not.toContain('unsafe-eval')
    expect(csp.match(/'unsafe-inline'/g)).toHaveLength(1)
    expect(csp).not.toContain('*')
  })

  it('grants explicit operations only to the local main window', async () => {
    const capability = await readJson('src-tauri/capabilities/default.json')
    const permissions = capability.permissions as string[]

    expect(capability.windows).toEqual(['main'])
    expect(capability).not.toHaveProperty('remote')
    expect(permissions).toEqual([
      'allow-seal-refresh-credential',
      'allow-refresh-access-credential',
      'allow-clear-refresh-credential',
      'allow-send-notification',
      'allow-get-window-state',
      'allow-minimize-window',
      'allow-toggle-maximize-window',
      'allow-hide-window',
      'allow-request-window-close',
      'allow-get-app-version',
      'allow-relaunch-app',
      'allow-exit-app',
      'allow-start-managed-download',
      'allow-cancel-managed-download',
      'allow-get-managed-download-progress',
      'allow-get-all-managed-downloads',
      'allow-remove-managed-download',
      'allow-reveal-managed-download',
      'core:event:allow-listen',
      'core:event:allow-unlisten',
      'updater:allow-check',
      'updater:allow-download',
      'updater:allow-install',
    ])
    expect(JSON.stringify(capability)).not.toMatch(/(?:dialog|opener|process|shell|window):/)
    expect(JSON.stringify(capability)).not.toContain('*')
  })

  it('puts every custom command behind the local-only application ACL', async () => {
    const [buildScript, capability, commands] = await Promise.all([
      source('src-tauri/build.rs'),
      readJson('src-tauri/capabilities/default.json'),
      rustCommandNames(),
    ])
    const manifestCommands = buildScript.match(
      /AppManifest::new\(\)\s*\.commands\(\s*&\[(?<commands>[\s\S]*?)\]\s*\)/,
    )

    expect(buildScript).toContain('tauri_build::try_build(')
    expect(manifestCommands?.groups?.commands).toBeDefined()
    const registeredCommands = [
      ...(manifestCommands?.groups?.commands ?? '').matchAll(/"([a-z][a-z0-9_]*)"/g),
    ].map((match) => match[1]!).sort()
    expect(registeredCommands).toEqual(commands)

    const permissions = capability.permissions as string[]
    const appPermissions = permissions.filter((permission) => !permission.includes(':')).sort()
    expect(appPermissions).toEqual(
      commands.map((command) => `allow-${command.replaceAll('_', '-')}`).sort(),
    )
    expect(capability.windows).toEqual(['main'])
    expect(capability).not.toHaveProperty('remote')
  })

  it('denies top-level navigation away from the packaged main-window origin', async () => {
    const [lib, windowPolicy] = await Promise.all([
      source('src-tauri/src/lib.rs'),
      source('src-tauri/src/window.rs'),
    ])

    expect(lib).toContain('.on_navigation(')
    expect(lib).toContain('is_authorized_navigation')
    expect(windowPolicy).toContain('pub fn is_authorized_navigation')
  })

  it('denies unmanaged WebView downloads and child-window creation', async () => {
    const [lib, windowPolicy] = await Promise.all([
      source('src-tauri/src/lib.rs'),
      source('src-tauri/src/window.rs'),
    ])

    expect(lib).toContain('WebviewWindowBuilder::from_config')
    expect(lib).toContain('.on_download(')
    expect(lib).toContain('should_allow_unmanaged_download')
    expect(lib).toContain('.on_new_window(')
    expect(lib).toContain('NewWindowResponse::Deny')
    expect(windowPolicy).toContain('pub const fn should_allow_unmanaged_download')
  })

  it('keeps the exact signed updater endpoint and public verification key', async () => {
    const config = await readJson('src-tauri/tauri.conf.json')
    const plugins = config.plugins as Record<string, unknown>
    const updater = plugins.updater as Record<string, unknown>

    expect(updater.endpoints).toEqual([
      'https://cos.zgm2003.cn/tauri_updater/{{target}}-{{arch}}.json',
    ])
    expect(updater.pubkey).toBe(
      'dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDBCQkQxMTJDRDIwQTBEOUYKUldTZkRRclNMQkc5Q3grSGFhSFpwOEk2M3BxZDNtNUJNTXl6bVFxeVM1THBRenFMY1F5ZE1IREEK',
    )
  })
})
