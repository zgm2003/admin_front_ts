import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

async function source(path: string): Promise<string> {
  return readFile(resolve(repositoryRoot, path), 'utf8')
}

describe('approved Tauri operations', () => {
  it('routes window, notification, and process operations through explicit Rust modules', async () => {
    const [lib, windowModule, notificationModule, processModule, adapter] = await Promise.all([
      source('src-tauri/src/lib.rs'),
      source('src-tauri/src/window.rs'),
      source('src-tauri/src/notification.rs'),
      source('src-tauri/src/process.rs'),
      source('src/adapters/tauri/native-bridge.ts'),
    ])

    expect(lib).toContain('mod window;')
    expect(lib).toContain('mod notification;')
    expect(lib).toContain('mod process;')
    expect(windowModule).toContain('pub fn get_window_state')
    expect(notificationModule).toContain('pub async fn send_notification')
    expect(processModule).toContain('pub fn relaunch_app')
    expect(adapter).not.toMatch(/@tauri-apps\/api\/(?:app|window)/)
    expect(adapter).not.toContain('@tauri-apps/plugin-process')
    expect(adapter).not.toContain('@tauri-apps/plugin-dialog')
  })

  it('exposes fixed process intents instead of an arbitrary exit code', async () => {
    const [types, adapter, store] = await Promise.all([
      source('src/modules/native/types.ts'),
      source('src/adapters/tauri/native-bridge.ts'),
      source('src/store/tauri.ts'),
    ])

    expect(types).toContain('relaunchAfterUpdate(): Promise<void>')
    expect(types).toContain('exitAfterUserConfirmation(): Promise<void>')
    expect(types).not.toMatch(/exit\(code:\s*number\)/)
    expect(adapter).toContain("invoke('relaunch_app', { intent: 'update-installed' })")
    expect(adapter).toContain("invoke('exit_app', { intent: 'user-confirmed-close' })")
    expect(store).toContain('process.exitAfterUserConfirmation()')
  })

  it('validates updater metadata/events and never logs raw updater failures', async () => {
    const [types, adapter, manager] = await Promise.all([
      source('src/modules/native/types.ts'),
      source('src/adapters/tauri/native-bridge.ts'),
      source('src/components/TauriManager/src/index.vue'),
    ])

    expect(types).toContain("{ readonly event: 'Finished' }")
    expect(types).not.toMatch(/event:\s*'Finished'.*data:/)
    expect(adapter).toContain('parseUpdaterVersion')
    expect(adapter).toContain('parseUpdaterDownloadEvent')
    expect(adapter).toContain('update must be downloaded before installation')
    expect(manager).not.toMatch(/console\.error\([^\n]*[Uu]pdate/)
  })

  it('removes browser-side dialog/process packages and the Rust process plugin', async () => {
    const [packageJson, cargoToml, lib] = await Promise.all([
      source('package.json'),
      source('src-tauri/Cargo.toml'),
      source('src-tauri/src/lib.rs'),
    ])

    expect(packageJson).not.toContain('@tauri-apps/plugin-dialog')
    expect(packageJson).not.toContain('@tauri-apps/plugin-process')
    expect(cargoToml).not.toContain('tauri-plugin-process')
    expect(lib).not.toContain('tauri_plugin_process::init')
  })
})
