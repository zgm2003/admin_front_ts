import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

async function readRepositoryFile(path: string): Promise<string> {
  try {
    return await readFile(resolve(repositoryRoot, path), 'utf8')
  } catch {
    return ''
  }
}

function escaped(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

describe('pinned Tauri Rust toolchain', () => {
  it('pins the exact compiler, components, and direct dependency versions', async () => {
    const toolchain = await readRepositoryFile('rust-toolchain.toml')
    const cargo = await readRepositoryFile('src-tauri/Cargo.toml')
    const nativeEntry = await readRepositoryFile('src-tauri/src/lib.rs')
    const capability = await readRepositoryFile('src-tauri/capabilities/default.json')

    expect(toolchain.trimEnd()).toBe([
      '[toolchain]',
      'channel = "1.97.0"',
      'components = ["rustfmt", "clippy"]',
      'profile = "minimal"',
    ].join('\n'))

    const exactPins = {
      'tauri-build': '2.5.5',
      tauri: '2.10.2',
      'tauri-plugin-dialog': '2.6.0',
      'tauri-plugin-updater': '2.10.0',
      serde: '1.0.228',
      serde_json: '1.0.149',
      'notify-rust': '4.12.0',
      image: '0.25.9',
      keyring: '4.1.5',
      url: '2.5.8',
      tempfile: '3.27.0',
      sha2: '0.11.0',
      uuid: '1.23.5',
      thiserror: '2.0.18',
      secrecy: '0.10.3',
      zeroize: '1.9.0',
      ipnet: '2.12.0',
      reqwest: '0.12.28',
      tokio: '1.49.0',
      'futures-util': '0.3.31',
      proptest: '1.11.0',
    } as const

    for (const [name, version] of Object.entries(exactPins)) {
      expect(cargo, `${name} must be pinned exactly`).toMatch(
        new RegExp(`^${escaped(name)}\\s*=.*["']=${escaped(version)}["']`, 'm'),
      )
    }
    expect(cargo).not.toMatch(/^tauri-plugin-opener\s*=/m)
    expect(cargo).not.toMatch(/^tauri-plugin-process\s*=/m)
    expect(nativeEntry).not.toContain('tauri_plugin_opener')
    expect(nativeEntry).not.toContain('tauri_plugin_process')
    expect(capability).not.toContain('opener:')
  })

  it('defines one fail-closed native verification script', async () => {
    const verifier = await readRepositoryFile('scripts/verify-tauri.ps1')

    expect(verifier).toContain('$ErrorActionPreference = \'Stop\'')
    expect(verifier).toContain('cargo fmt --all -- --check')
    expect(verifier).toContain('cargo clippy --all-targets --all-features -- -D warnings')
    expect(verifier).toContain('cargo test --all-features')
    expect(verifier).toContain('cargo audit --deny warnings')
    expect(verifier).toContain('cargo build --locked --release')
  })
})
