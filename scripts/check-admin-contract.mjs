import { isDeepStrictEqual } from 'node:util'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateAdminTypes, generatedAdminOutputs } from './generate-admin-types.mjs'
import { syncBundleSnapshot, validateBundle } from './sync-admin-contract.mjs'

function parseJson(text, label) {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`${label} is not valid UTF-8 JSON`, { cause: error })
  }
}

export async function checkAdminContract(frontendRoot = process.cwd()) {
  const root = resolve(frontendRoot)
  const copiedBundle = join(root, 'contracts/backend/admin/v1')
  const validation = await validateBundle(copiedBundle)
  const lockPath = join(root, 'contracts/backend/admin/lock.json')
  const committedLock = parseJson(await readFile(lockPath, 'utf8'), 'contracts/backend/admin/lock.json')
  if (!isDeepStrictEqual(committedLock, validation.lock)) {
    throw new Error('Admin contract lock does not match the copied manifest and artifact hashes')
  }

  const temporaryRoot = await mkdtemp(join(tmpdir(), 'admin-contract-check-'))
  try {
    await syncBundleSnapshot(copiedBundle, temporaryRoot)
    await generateAdminTypes(temporaryRoot)
    for (const output of generatedAdminOutputs) {
      const [committed, regenerated] = await Promise.all([
        readFile(join(root, output)),
        readFile(join(temporaryRoot, output)),
      ])
      if (!committed.equals(regenerated)) {
        throw new Error(`generated Admin contract output is stale: ${output}`)
      }
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }

  return validation.lock
}

async function main() {
  const lock = await checkAdminContract()
  process.stdout.write(`Admin contract verified: ${lock.manifest_sha256}\n`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
