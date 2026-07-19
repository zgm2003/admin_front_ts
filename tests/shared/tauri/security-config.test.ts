import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

async function readJson(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(resolve(repositoryRoot, path), 'utf8')) as Record<string, unknown>
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
      'core:event:allow-listen',
      'core:event:allow-unlisten',
      'updater:allow-check',
      'updater:allow-download',
      'updater:allow-install',
    ])
    expect(JSON.stringify(capability)).not.toMatch(/(?:dialog|opener|process|shell|window):/)
    expect(JSON.stringify(capability)).not.toContain('*')
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
