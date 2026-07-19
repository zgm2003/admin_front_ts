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
      'core:window:allow-hide',
      'core:window:allow-minimize',
      'core:window:allow-toggle-maximize',
      'core:window:allow-is-maximized',
      'core:window:allow-is-minimized',
      'core:window:allow-is-focused',
      'core:window:allow-is-visible',
      'core:window:allow-close',
      'dialog:allow-save',
      'updater:allow-check',
      'updater:allow-download-and-install',
      'process:allow-restart',
      'process:allow-exit',
    ])
    expect(JSON.stringify(capability)).not.toMatch(/(?:opener|shell):/)
    expect(JSON.stringify(capability)).not.toContain('*')
  })
})
