import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { checkBrowserOnly } from '../../../scripts/check-browser-only.mjs'

const temporaryRoots: string[] = []

const baseFiles: Readonly<Record<string, string>> = {
  'package.json': JSON.stringify({
    private: true,
    scripts: { test: 'vitest run' },
    dependencies: { vue: '3.5.24' },
    devDependencies: { vitest: '4.0.7' },
  }),
  'src/main.ts': 'export const runtime = "browser"\n',
  'src/modules/http/generated/admin.ts': 'export interface LoginResponse { access_token: string }\n',
  'contracts/backend/admin/v1/openapi.json': JSON.stringify({
    openapi: '3.1.0',
    components: {
      schemas: {
        LoginResponse: { type: 'object', properties: { access_token: { type: 'string' } } },
      },
    },
  }),
  'contracts/backend/admin/v1/permissions.json': JSON.stringify([{ code: 'system:user:list' }]),
  'contracts/backend/admin/v1/views.json': JSON.stringify([{ path: 'system/user/index' }]),
}

async function fixture(overrides: Readonly<Record<string, string>> = {}) {
  const root = await mkdtemp(join(tmpdir(), 'browser-only-'))
  temporaryRoots.push(root)
  const files = { ...baseFiles, ...overrides }
  await Promise.all(Object.entries(files).map(async ([relativePath, contents]) => {
    const destination = join(root, relativePath)
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, contents, 'utf8')
  }))
  return { root, trackedPaths: Object.keys(files) }
}

async function runFixture(overrides: Readonly<Record<string, string>> = {}) {
  const { root, trackedPaths } = await fixture(overrides)
  return checkBrowserOnly(root, { trackedPaths, skipWorktreeCheck: true })
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('Browser-only architecture gate', () => {
  it('accepts one browser runtime with Cookie-only generated contracts', async () => {
    await expect(runFixture()).resolves.toMatchObject({ checkedFiles: expect.any(Number) })
  })

  it.each([
    'src-tauri/tauri.conf.json',
    'Cargo.toml',
    'Cargo.lock',
    'rust-toolchain.toml',
    '.github/workflows/deploy.yml',
    '.worktrees/retired-client/file.txt',
    'src/api/system/clientVersion.ts',
    'src/views/Main/system/client-version/index.vue',
  ])('rejects forbidden tracked path %s', async (relativePath) => {
    await expect(runFixture({ [relativePath]: 'forbidden\n' })).rejects.toThrow(relativePath)
  })

  it.each([
    { dependencies: { '@tauri-apps/api': '2.0.0' }, scripts: { test: 'vitest run' } },
    { dependencies: { vue: '3.5.24' }, scripts: { desktop: 'tauri build' } },
  ])('rejects Tauri dependencies and package scripts', async ({ dependencies, scripts }) => {
    const packageJson = JSON.stringify({ private: true, dependencies, scripts })
    await expect(runFixture({ 'package.json': packageJson })).rejects.toThrow(/package\.json/u)
  })

  it.each([
    'const bridge: NativeBridge = createBridge()\n',
    'const mode = "desktop"\n',
    'const desktopWindow = { maximized: true }\n',
    'const nativeClient = createClient()\n',
    'const tauriInvoke = createInvoker()\n',
    'const header = "X-Admin-Client-Variant"\n',
    'const variant = import.meta.env.VITE_ADMIN_CLIENT_VARIANT\n',
    'const mockAccessToken = "runtime-token"\n',
  ])('rejects retired or mock authentication production source: %s', async (source) => {
    await expect(runFixture({ 'src/main.ts': source })).rejects.toThrow('src/main.ts')
  })

  it.each(['refresh_token', 'refresh_expires_in'])('rejects generated public field %s', async (field) => {
    const openapi = JSON.stringify({
      openapi: '3.1.0',
      components: { schemas: { LoginResponse: { properties: { [field]: { type: 'string' } } } } },
    })
    await expect(runFixture({
      'contracts/backend/admin/v1/openapi.json': openapi,
      'src/modules/http/generated/admin.ts': `export interface LoginResponse { ${field}: string }\n`,
    })).rejects.toThrow(field)
  })

  it('rejects retired credential fields in generated TypeScript even when contract JSON is clean', async () => {
    await expect(runFixture({
      'src/modules/http/generated/admin.ts': 'export interface LoginResponse { refresh_token: string }\n',
    })).rejects.toThrow('refresh_token')
  })

  it('rejects the retired client-variant header inside parsed contract JSON', async () => {
    const openapi = JSON.stringify({
      openapi: '3.1.0',
      paths: {
        '/auth/login': {
          post: { parameters: [{ in: 'header', name: 'X-Admin-Client-Variant' }] },
        },
      },
    })
    await expect(runFixture({
      'contracts/backend/admin/v1/openapi.json': openapi,
    })).rejects.toThrow('X-Admin-Client-Variant')
  })

  it.each([
    ['contracts/backend/admin/v1/permissions.json', JSON.stringify([{ code: 'system:clientVersion:list' }])],
    ['contracts/backend/admin/v1/views.json', JSON.stringify([{ path: 'system/clientVersion/index' }])],
  ])('rejects client-version identifiers in %s', async (path, contents) => {
    await expect(runFixture({ [path]: contents })).rejects.toThrow(/client-version/u)
  })

  it('fails closed when a contract JSON file cannot be parsed', async () => {
    await expect(runFixture({
      'contracts/backend/admin/v1/openapi.json': '{not-json',
    })).rejects.toThrow(/valid JSON/u)
  })
})
