import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

async function source(path: string): Promise<string> {
  return readFile(resolve(repositoryRoot, path), 'utf8').catch(() => '')
}

describe('blocking Windows Tauri security gate', () => {
  it('pins and verifies every host tool before running locked Rust gates', async () => {
    const verifier = await source('scripts/verify-tauri.ps1')

    expect(verifier).toMatch(/\$ExpectedRustVersion\s*=\s*'1\.97\.0'/)
    expect(verifier).toMatch(/\$ExpectedCargoAuditVersion\s*=\s*'0\.22\.2'/)
    expect(verifier).toMatch(/\$ExpectedCargoTauriVersion\s*=\s*'2\.10\.0'/)
    expect(verifier).toContain('rustc --version')
    expect(verifier).toContain('cargo audit --version')
    expect(verifier).toContain('cargo tauri --version')
    expect(verifier).toContain('x86_64-pc-windows-msvc')
    expect(verifier).toContain('cargo fmt --all -- --check')
    expect(verifier).toContain('cargo clippy --locked --all-targets --all-features -- -D warnings')
    expect(verifier).toContain('cargo test --locked --all-features')
    expect(verifier).toContain('cargo audit --deny warnings')
    expect(verifier).toContain('cargo build --locked --release --target x86_64-pc-windows-msvc')
  })

  it('runs source and TypeScript gates/build inside the declared Docker boundary', async () => {
    const verifier = await source('scripts/verify-tauri.ps1')

    expect(verifier).toContain('scripts/tests/tauri-security-source.tests.ps1')
    expect(verifier).toContain('node:22.23.1-alpine')
    expect(verifier).toContain('npm ci --ignore-scripts')
    expect(verifier).toContain('npm test -- tests/shared/tauri tests/unit/native tests/integration/native')
    expect(verifier).toContain('npm run typecheck')
    expect(verifier).toContain('npm run build')
    expect(verifier).toContain('Invoke-Docker')
    const hostNpmLines = verifier.split(/\r?\n/).filter((line) => /^\s*(?:&\s*)?npm(?:\.cmd)?\s/.test(line))
    expect(hostNpmLines).toEqual([])
  })

  it('builds only a fresh unsigned-local Windows NSIS package without publishing', async () => {
    const verifier = await source('scripts/verify-tauri.ps1')

    expect(verifier).toContain('cargo tauri build')
    expect(verifier).toContain('--bundles nsis')
    expect(verifier).toContain('--target x86_64-pc-windows-msvc')
    expect(verifier).toContain('"createUpdaterArtifacts":false')
    expect(verifier).toContain('Tee-Object -Variable tauriBuildOutput')
    expect(verifier).toContain('Failed to add bundler type')
    expect(verifier).toMatch(/bundle[\\/]nsis[\\/][^\r\n]*\*\.exe/)
    expect(verifier).not.toMatch(/TAURI_(?:SIGNING_)?PRIVATE_KEY/)
    expect(verifier).not.toMatch(/(?:upload|publish|candidate|github|coscmd|coscli)/i)
    expect(verifier).not.toMatch(/(?:--skip|--no-verify|ErrorAction\s+Continue|SilentlyContinue)/i)
  })

  it('contains no browser-automation dependency and never starts host Vite', async () => {
    const [packageJson, packageLock, configJson] = await Promise.all([
      source('package.json'),
      source('package-lock.json'),
      source('src-tauri/tauri.conf.json'),
    ])
    const manifest = JSON.parse(packageJson) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const lock = JSON.parse(packageLock) as { packages?: Record<string, unknown> }
    const config = JSON.parse(configJson) as { build: Record<string, unknown> }
    const marker = 'play' + 'wright'
    const declared = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })
    const installed = Object.keys(lock.packages ?? {})

    expect(declared.filter((name) => name.toLowerCase().includes(marker))).toEqual([])
    expect(manifest.devDependencies?.['@tauri-apps/cli']).toBe('2.10.0')
    expect(installed.filter((name) => name.toLowerCase().includes(marker))).toEqual([])
    expect(config.build.beforeDevCommand).toBe('')
    expect(config.build.frontendDist).toBe('../dist')
  })

  it('leaves every packaged-app acceptance item explicitly owned by the user', async () => {
    const checklist = await source('docs/acceptance/p08-tauri-windows-manual.md')

    expect(checklist).toContain('Frontend revision:')
    expect(checklist).toContain('Rust revision:')
    for (const item of [
      '离线本地 UI 加载',
      '密码登录',
      '浏览器与桌面凭证隔离',
      '重启与会话恢复',
      'Windows 凭证清理',
      '受管下载允许/拒绝/取消',
      '窗口关闭与最小化',
      '系统通知权限',
      '更新签名失败',
      '无远程原生能力',
    ]) {
      expect(checklist).toContain(`- [ ] ${item}`)
    }
    expect(checklist).not.toMatch(/- \[[xX]\]/)
    expect(checklist).toContain('验收人（用户填写）')
  })
})
