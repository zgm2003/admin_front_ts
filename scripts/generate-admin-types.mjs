import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import openapiTS, { astToString } from 'openapi-typescript'
import { validateBundle } from './sync-admin-contract.mjs'

export const generatedAdminOutputs = Object.freeze([
  'src/modules/http/generated/admin.ts',
  'src/modules/routing/generated/permissions.ts',
  'src/modules/routing/generated/views.ts',
])

function assertSortedUniqueStrings(values, label) {
  if (!Array.isArray(values) || values.some((value) => typeof value !== 'string' || !value)) {
    throw new Error(`${label} must be a non-empty string array`)
  }
  const sorted = [...values].sort()
  if (new Set(sorted).size !== sorted.length) {
    throw new Error(`${label} contains duplicate values`)
  }
  return sorted
}

function header(manifestSha) {
  return [
    `// Generated from Admin Contract Bundle manifest SHA-256: ${manifestSha}`,
    '// Do not edit manually.',
    '',
  ].join('\n')
}

function literalArray(name, values) {
  return [
    `export const ${name} = [`,
    ...values.map((value) => `  ${JSON.stringify(value)},`),
    '] as const',
    '',
  ].join('\n')
}

async function writeGenerated(frontendRoot, relativePath, contents) {
  const destination = resolve(frontendRoot, relativePath)
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, contents.endsWith('\n') ? contents : `${contents}\n`, 'utf8')
}

export async function generateAdminTypes(frontendRoot = process.cwd()) {
  const root = resolve(frontendRoot)
  const contractRoot = join(root, 'contracts/backend/admin/v1')
  const validation = await validateBundle(contractRoot)
  const manifestSha = validation.lock.manifest_sha256
  const openapi = JSON.parse(await readFile(join(contractRoot, 'openapi.json'), 'utf8'))
  const paths = Object.keys(openapi.paths ?? {})
  const forbiddenPath = paths.find((path) => path.startsWith('/api/app/') || path.startsWith('/api/canvas/'))
  if (forbiddenPath) {
    throw new Error(`cannot generate retired operation path: ${forbiddenPath}`)
  }

  const openapiAst = await openapiTS(openapi, { alphabetize: true })
  await writeGenerated(
    root,
    generatedAdminOutputs[0],
    `${header(manifestSha)}${astToString(openapiAst)}`,
  )

  const permissions = JSON.parse(await readFile(join(contractRoot, 'permissions.json'), 'utf8'))
  const permissionCodes = assertSortedUniqueStrings(permissions.permission_codes, 'permission_codes')
  await writeGenerated(root, generatedAdminOutputs[1], [
    header(manifestSha),
    literalArray('permissionCodes', permissionCodes),
    'export type PermissionCode = typeof permissionCodes[number]',
    '',
    'export const permissionCodeSet: ReadonlySet<PermissionCode> = new Set(permissionCodes)',
    '',
  ].join('\n'))

  const views = JSON.parse(await readFile(join(contractRoot, 'views.json'), 'utf8'))
  const viewKeys = assertSortedUniqueStrings(
    Array.isArray(views.views) ? views.views.map((view) => view?.view_key) : views.views,
    'view keys',
  )
  await writeGenerated(root, generatedAdminOutputs[2], [
    header(manifestSha),
    literalArray('backendViewKeys', viewKeys),
    'export type BackendViewKey = typeof backendViewKeys[number]',
    '',
    'export const backendViewKeySet: ReadonlySet<BackendViewKey> = new Set(backendViewKeys)',
    '',
  ].join('\n'))

  return generatedAdminOutputs
}

async function main() {
  await generateAdminTypes()
  process.stdout.write('Admin contract types generated.\n')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
