import { readFile, readdir, stat } from 'node:fs/promises'
import { basename, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const forbiddenRootEntries = [
  'src-tauri',
  'Cargo.toml',
  'Cargo.lock',
  'rust-toolchain.toml',
  '.github',
  '.worktrees',
]

const sourceExtensions = new Set(['.cjs', '.js', '.json', '.mjs', '.ts', '.tsx', '.vue'])
const retiredSourcePatterns = [
  { label: 'Tauri identifier', pattern: /(?:@tauri-apps|\btauri\b|\btauri[A-Z_]\w*\b|\bTauri\w*\b)/u },
  { label: 'desktop identifier', pattern: /\b(?:desktop\b|desktop[A-Z_]\w*\b|Desktop\w*\b|desktop(?:-[a-z0-9]+)+\b)/u },
  { label: 'native bridge identifier', pattern: /\b(?:NativeBridge|getNativeBridge|native[A-Z_]\w*|native\.|(?:const|let|var)\s+native\b)/u },
  { label: 'client variant identifier', pattern: /\b(?:ClientVariant|clientVariant|ClientBrowser|ClientDesktop|client[-_]?variant)\b/u },
  { label: 'retired Admin client header', pattern: /X-Admin-Client-Variant/u },
  { label: 'retired Admin client environment variable', pattern: /VITE_ADMIN_CLIENT_VARIANT/u },
  { label: 'retired public credential field', pattern: /\b(?:refresh_token|refresh_expires_in)\b/u },
  { label: 'client-version identifier', pattern: /client(?:Version|[-_]versions?)/iu },
]
const authMockPattern = /\b(?:(?:mock|fake|stub|fallback)\w*(?:auth|login|session|credential|token|password|account)|(?:auth|login|session|credential|token|password|account)\w*(?:mock|fake|stub|fallback))\b/iu
const hardcodedTokenPattern = /\b(?:access|refresh)[-_]?token\s*[:=]\s*['"][^'"]+['"]/iu
const retiredPublicFields = new Set(['refresh_token', 'refresh_expires_in'])

function normalizePath(path) {
  return path.split(sep).join('/').replace(/^\.\//u, '')
}

async function pathExists(path) {
  try {
    await stat(path)
    return true
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return false
    throw error
  }
}

function parseJson(source, path) {
  try {
    return JSON.parse(source)
  } catch (error) {
    throw new Error(`${path} is not valid JSON`, { cause: error })
  }
}

function readIndexVersion(buffer) {
  if (buffer.length < 12 || buffer.toString('ascii', 0, 4) !== 'DIRC') {
    throw new Error('.git/index is not a supported Git index')
  }
  return buffer.readUInt32BE(4)
}

async function readTrackedPathsFromIndex(root) {
  const indexPath = join(root, '.git', 'index')
  const buffer = await readFile(indexPath)
  const version = readIndexVersion(buffer)
  if (version !== 2 && version !== 3) {
    throw new Error(`.git/index version ${version} is unsupported; use Git index version 2 or 3`)
  }

  const entryCount = buffer.readUInt32BE(8)
  const trackedPaths = []
  let offset = 12
  for (let index = 0; index < entryCount; index += 1) {
    const entryStart = offset
    const fixedEntrySize = 62
    if (offset + fixedEntrySize > buffer.length) throw new Error('.git/index entry is truncated')
    const flags = buffer.readUInt16BE(offset + 60)
    offset += fixedEntrySize
    if ((flags & 0x4000) !== 0) offset += 2

    const terminator = buffer.indexOf(0, offset)
    if (terminator < 0) throw new Error('.git/index path is not terminated')
    trackedPaths.push(normalizePath(buffer.toString('utf8', offset, terminator)))
    offset = terminator + 1
    while ((offset - entryStart) % 8 !== 0) offset += 1
  }
  return trackedPaths
}

async function assertNoRegisteredWorktrees(root) {
  const gitPath = join(root, '.git')
  const gitStat = await stat(gitPath)
  if (!gitStat.isDirectory()) {
    throw new Error('Browser-only gate requires the primary checkout, not a Git worktree')
  }
  const registrations = join(gitPath, 'worktrees')
  if (!(await pathExists(registrations))) return
  const entries = await readdir(registrations)
  if (entries.length > 0) {
    throw new Error(`registered Git worktrees are forbidden: ${entries.join(', ')}`)
  }
}

function pathViolation(path) {
  const normalized = normalizePath(path)
  const lower = normalized.toLowerCase()
  const segments = lower.split('/')
  const name = basename(lower)
  if (segments.includes('.github')) return '.github is forbidden'
  if (segments.includes('.worktrees')) return '.worktrees is forbidden'
  if (segments.includes('src-tauri')) return 'src-tauri is forbidden'
  if (name === 'cargo.toml' || name === 'cargo.lock' || name === 'rust-toolchain.toml') {
    return `${name} is forbidden`
  }
  const compact = lower.replaceAll('-', '').replaceAll('_', '')
  if (
    compact.includes('clientversion')
    && (
      lower.startsWith('src/api/')
      || lower.startsWith('src/views/')
      || lower.includes('/generated/')
    )
  ) {
    return 'client-version API/page/view path is forbidden'
  }
  return null
}

function inspectPackageJson(packageJson, violations) {
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    const dependencies = packageJson[section]
    if (!dependencies || typeof dependencies !== 'object' || Array.isArray(dependencies)) continue
    for (const name of Object.keys(dependencies)) {
      if (/^@tauri-apps\//iu.test(name) || /\btauri\b/iu.test(name)) {
        violations.push(`package.json ${section} contains retired dependency ${name}`)
      }
    }
  }

  const scripts = packageJson.scripts
  if (!scripts || typeof scripts !== 'object' || Array.isArray(scripts)) return
  for (const [name, command] of Object.entries(scripts)) {
    if (typeof command !== 'string') continue
    if (/(?:@tauri-apps|\btauri\b|\bcargo\b|\brustc?\b|\bnsis\b|\bdesktop\b)/iu.test(`${name} ${command}`)) {
      violations.push(`package.json script ${name} contains retired desktop tooling`)
    }
  }
}

function inspectPackageLock(packageLock, violations) {
  const packages = packageLock.packages
  if (!packages || typeof packages !== 'object' || Array.isArray(packages)) return
  for (const path of Object.keys(packages)) {
    if (/(?:^|\/)@tauri-apps(?:\/|$)|(?:^|\/)tauri(?:\/|$)/iu.test(path)) {
      violations.push(`package-lock.json contains retired dependency ${path}`)
    }
  }
}

function inspectContractValue(value, path, violations) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectContractValue(item, `${path}[${index}]`, violations))
    return
  }
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string') {
      const compact = value.toLowerCase().replaceAll('-', '').replaceAll('_', '')
      if (retiredPublicFields.has(value)) {
        violations.push(`${path} contains retired public field ${value}`)
      }
      if (value === 'X-Admin-Client-Variant' || compact.includes('clientvariant')) {
        violations.push(`${path} contains retired client variant X-Admin-Client-Variant`)
      }
      if (compact.includes('clientversion')) {
        violations.push(`${path} contains a client-version identifier`)
      }
    }
    return
  }

  for (const [key, nested] of Object.entries(value)) {
    if (retiredPublicFields.has(key)) violations.push(`${path} contains retired public field ${key}`)
    const compactKey = key.toLowerCase().replaceAll('-', '').replaceAll('_', '')
    if (key === 'X-Admin-Client-Variant' || compactKey.includes('clientvariant')) {
      violations.push(`${path} contains a retired client-variant contract key`)
    }
    if (compactKey.includes('clientversion')) violations.push(`${path} contains a client-version identifier`)
    inspectContractValue(nested, `${path}.${key}`, violations)
  }
}

async function readRequiredJson(root, relativePath) {
  const source = await readFile(join(root, relativePath), 'utf8')
  return parseJson(source, relativePath)
}

function isProductionSource(path) {
  return path.startsWith('src/') && sourceExtensions.has(extname(path).toLowerCase())
}

async function inspectProductionSource(root, path, violations) {
  const source = await readFile(join(root, path), 'utf8')
  for (const { label, pattern } of retiredSourcePatterns) {
    const match = source.match(pattern)
    if (match) violations.push(`${path} contains ${label}: ${match[0]}`)
  }
  if (!path.startsWith('src/i18n/') && authMockPattern.test(source)) {
    violations.push(`${path} contains runtime mock/fallback authentication data`)
  }
  if (hardcodedTokenPattern.test(source)) {
    violations.push(`${path} contains a hard-coded authentication token`)
  }
  if (/(?:^|\/)native(?:\/|$)/iu.test(path)) {
    violations.push(`${path} uses a retired native production path`)
  }
  return source
}

export async function checkBrowserOnly(repositoryRoot = process.cwd(), options = {}) {
  const root = resolve(repositoryRoot)
  if (!options.skipWorktreeCheck) await assertNoRegisteredWorktrees(root)
  const trackedPaths = (options.trackedPaths ?? await readTrackedPathsFromIndex(root))
    .map(normalizePath)
    .sort()
  const violations = []

  for (const entry of forbiddenRootEntries) {
    if (await pathExists(join(root, entry))) violations.push(`${entry} exists in the checkout`)
  }
  for (const path of trackedPaths) {
    const reason = pathViolation(path)
    if (reason) violations.push(`${path}: ${reason}`)
  }

  const packageJson = await readRequiredJson(root, 'package.json')
  inspectPackageJson(packageJson, violations)
  if (await pathExists(join(root, 'package-lock.json'))) {
    inspectPackageLock(await readRequiredJson(root, 'package-lock.json'), violations)
  }

  let checkedFiles = 0
  for (const path of trackedPaths.filter(isProductionSource)) {
    if (!(await pathExists(join(root, path)))) {
      violations.push(`${path} is tracked but missing from the checkout`)
      continue
    }
    await inspectProductionSource(root, path, violations)
    checkedFiles += 1
  }

  const contractPaths = trackedPaths.filter((path) => (
    path.startsWith('contracts/backend/admin/v1/') && extname(path).toLowerCase() === '.json'
  ))
  for (const path of contractPaths) {
    const parsed = await readRequiredJson(root, path)
    inspectContractValue(parsed, path, violations)
  }

  const uniqueViolations = [...new Set(violations)].sort()
  if (uniqueViolations.length > 0) {
    throw new Error(`Browser-only architecture violations:\n- ${uniqueViolations.join('\n- ')}`)
  }

  return { checkedFiles, contractFiles: contractPaths.length, trackedPaths: trackedPaths.length }
}

async function main() {
  const result = await checkBrowserOnly()
  process.stdout.write(
    `Browser-only architecture verified: ${result.trackedPaths} tracked paths, ${result.checkedFiles} production files, ${result.contractFiles} contract files\n`,
  )
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
