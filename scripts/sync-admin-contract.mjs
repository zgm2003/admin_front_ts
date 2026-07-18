import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const requiredArtifacts = Object.freeze([
  'openapi.json',
  'permissions.json',
  'realtime/envelope.schema.json',
  'realtime/events.schema.json',
  'views.json',
])

const expectedBundleFiles = Object.freeze([...requiredArtifacts, 'manifest.json'].sort())
const gitShaPattern = /^[0-9a-f]{40}$/
const sha256Pattern = /^[0-9a-f]{64}$/
const versionPattern = /^[a-z0-9][a-z0-9._-]*$/i

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function assertGitSha(value) {
  if (typeof value !== 'string' || !gitShaPattern.test(value)) {
    throw new Error(`invalid backend Git commit: ${String(value)}`)
  }
  return value
}

export function assertSha256(value, label = 'SHA-256') {
  if (typeof value !== 'string' || !sha256Pattern.test(value)) {
    throw new Error(`invalid ${label}: ${String(value)}`)
  }
  return value
}

export function assertBundleVersion(value) {
  if (typeof value !== 'string' || !versionPattern.test(value)) {
    throw new Error(`invalid Admin bundle version: ${String(value)}`)
  }
  return value
}

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(current, entry.name)
    if (entry.isDirectory()) {
      files.push(...await listFiles(root, path))
    } else if (entry.isFile()) {
      files.push(relative(root, path).split(sep).join('/'))
    } else {
      throw new Error(`unsupported contract artifact entry: ${path}`)
    }
  }
  return files.sort()
}

function assertExactNames(actual, expected, label) {
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    throw new Error(`${label} mismatch: expected ${expected.join(', ')}, received ${actual.join(', ')}`)
  }
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch (error) {
    throw new Error(`${label} is not valid UTF-8 JSON`, { cause: error })
  }
}

export async function validateBundle(bundleRoot) {
  const root = resolve(bundleRoot)
  assertExactNames(await listFiles(root), expectedBundleFiles, 'Admin Contract Bundle file set')

  const manifestBytes = await readFile(join(root, 'manifest.json'))
  const manifest = parseJson(manifestBytes, 'manifest.json')
  const backendCommit = assertGitSha(manifest.backend_commit)
  const bundleVersion = assertBundleVersion(manifest.bundle_version)
  if (!manifest.artifacts || typeof manifest.artifacts !== 'object' || Array.isArray(manifest.artifacts)) {
    throw new Error('manifest.json artifacts must be an object')
  }
  assertExactNames(Object.keys(manifest.artifacts).sort(), [...requiredArtifacts].sort(), 'manifest artifact set')

  const artifacts = {}
  for (const name of requiredArtifacts) {
    const descriptor = manifest.artifacts[name]
    if (!descriptor || typeof descriptor !== 'object' || Array.isArray(descriptor)) {
      throw new Error(`manifest descriptor missing for ${name}`)
    }
    const expectedSha = assertSha256(descriptor.sha256, `${name} SHA-256`)
    const actualSha = sha256(await readFile(join(root, ...name.split('/'))))
    if (actualSha !== expectedSha) {
      throw new Error(`${name} SHA-256 mismatch: expected ${expectedSha}, received ${actualSha}`)
    }
    artifacts[name] = expectedSha
  }

  const openapi = parseJson(await readFile(join(root, 'openapi.json')), 'openapi.json')
  const forbiddenPath = Object.keys(openapi.paths ?? {}).find(
    (path) => path.startsWith('/api/app/') || path.startsWith('/api/canvas/'),
  )
  if (forbiddenPath) {
    throw new Error(`Admin contract contains retired operation path: ${forbiddenPath}`)
  }

  return {
    manifest,
    manifestBytes,
    lock: {
      backend_commit: backendCommit,
      bundle_version: bundleVersion,
      manifest_sha256: sha256(manifestBytes),
      artifacts,
    },
  }
}

export async function syncBundleSnapshot(sourceBundleRoot, frontendRoot = process.cwd()) {
  const sourceRoot = resolve(sourceBundleRoot)
  const destinationRoot = resolve(frontendRoot, 'contracts/backend/admin/v1')
  const lockPath = resolve(frontendRoot, 'contracts/backend/admin/lock.json')
  const validation = await validateBundle(sourceRoot)

  await rm(destinationRoot, { recursive: true, force: true })
  for (const name of expectedBundleFiles) {
    const destination = join(destinationRoot, ...name.split('/'))
    await mkdir(dirname(destination), { recursive: true })
    await cp(join(sourceRoot, ...name.split('/')), destination)
  }
  await mkdir(dirname(lockPath), { recursive: true })
  await writeFile(lockPath, `${JSON.stringify(validation.lock, null, 2)}\n`, 'utf8')
  return validation.lock
}

function runGit(backendRoot, args, options = {}) {
  return execFileSync('git', ['-C', backendRoot, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', options.allowFailure ? 'ignore' : 'pipe'],
  }).trim()
}

function parseArguments(argv) {
  const parsed = {}
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]
    const value = argv[index + 1]
    if ((key !== '--backend' && key !== '--commit') || !value) {
      throw new Error('usage: sync-admin-contract.mjs --backend <path> --commit <git-sha>')
    }
    parsed[key.slice(2)] = value
  }
  if (!parsed.backend || !parsed.commit) {
    throw new Error('usage: sync-admin-contract.mjs --backend <path> --commit <git-sha>')
  }
  return parsed
}

export async function syncFromBackend({ backend, commit, frontendRoot = process.cwd() }) {
  const backendRoot = resolve(backend)
  const cleanStatus = runGit(backendRoot, ['status', '--porcelain', '--untracked-files=normal'])
  if (cleanStatus) {
    throw new Error(`backend checkout must be clean before contract sync:\n${cleanStatus}`)
  }
  const validation = await validateBundle(join(backendRoot, 'contracts/admin/v1'))
  const requestedCommit = assertGitSha(commit)
  if (requestedCommit !== validation.lock.backend_commit) {
    throw new Error(`requested backend commit ${requestedCommit} does not match manifest ${validation.lock.backend_commit}`)
  }
  try {
    runGit(backendRoot, ['merge-base', '--is-ancestor', requestedCommit, 'HEAD'])
  } catch (error) {
    throw new Error(`manifest backend commit ${requestedCommit} is not an ancestor of the backend checkout`, { cause: error })
  }
  return syncBundleSnapshot(join(backendRoot, 'contracts/admin/v1'), frontendRoot)
}

async function main() {
  const args = parseArguments(process.argv.slice(2))
  const lock = await syncFromBackend(args)
  process.stdout.write(`Admin contract synchronized: ${lock.manifest_sha256}\n`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
