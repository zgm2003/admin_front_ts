import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { adminOperations, type AdminOperationInput } from '@/modules/http/generated/operations'
import { encodeOperationInput } from '@/modules/http/operations'

const temporaryRoots: string[] = []
const lockedBundle = resolve(process.cwd(), 'contracts/backend/admin/v1')

async function createTemporaryRoot(name: string) {
  const root = await mkdtemp(join(tmpdir(), `admin-${name}-`))
  temporaryRoots.push(root)
  return root
}

async function copyBackendBundle(name: string) {
  const root = await createTemporaryRoot(name)
  const bundle = join(root, 'v1')
  await cp(lockedBundle, bundle, { recursive: true })
  return bundle
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('Admin Contract Bundle consumer', () => {
  it('encodes the documented payment certificate upload as multipart form data', async () => {
    const file = new Blob(['certificate'], { type: 'application/x-pem-file' })
    const input: AdminOperationInput<'post_api_admin_v1_payment_certificates'> = {
      body: {
        cert_type: 'app_cert',
        config_code: 'alipay-main',
        file,
      },
    }

    const operation = adminOperations.post_api_admin_v1_payment_certificates
    const encoded = encodeOperationInput(operation, input)

    expect(operation.timeout).toBe('upload')
    expect(encoded.body).toBeInstanceOf(FormData)
    const body = encoded.body as FormData
    expect(body.get('cert_type')).toBe('app_cert')
    expect(body.get('config_code')).toBe('alipay-main')
    const encodedFile = body.get('file')
    expect(encodedFile).toBeInstanceOf(Blob)
    expect(await (encodedFile as Blob).text()).toBe('certificate')
    expect((encodedFile as Blob).type).toBe('application/x-pem-file')
  })

  it('rejects a backend artifact whose bytes do not match the manifest SHA', async () => {
    const bundle = await copyBackendBundle('contract-tamper')
    const openapiPath = join(bundle, 'openapi.json')
    await writeFile(openapiPath, `${await readFile(openapiPath, 'utf8')} `, 'utf8')
    const { validateBundle } = await import('../../../scripts/sync-admin-contract.mjs')

    await expect(validateBundle(bundle)).rejects.toThrow(/openapi\.json.*SHA-256/i)
  })

  it('detects a tampered copied snapshot instead of accepting stale generated output', async () => {
    const frontendRoot = await createTemporaryRoot('contract-check')
    const { syncBundleSnapshot } = await import('../../../scripts/sync-admin-contract.mjs')
    const { checkAdminContract } = await import('../../../scripts/check-admin-contract.mjs')
    await syncBundleSnapshot(lockedBundle, frontendRoot)
    const copiedOpenapi = join(frontendRoot, 'contracts/backend/admin/v1/openapi.json')
    await writeFile(copiedOpenapi, `${await readFile(copiedOpenapi, 'utf8')} `, 'utf8')

    await expect(checkAdminContract(frontendRoot)).rejects.toThrow(/openapi\.json.*SHA-256/i)
  })

  it('generates byte-identical Admin-only transport, permission, and view types', async () => {
    const firstRoot = await createTemporaryRoot('contract-first')
    const secondRoot = await createTemporaryRoot('contract-second')
    const { syncBundleSnapshot } = await import('../../../scripts/sync-admin-contract.mjs')
    const { generateAdminTypes } = await import('../../../scripts/generate-admin-types.mjs')
    await syncBundleSnapshot(lockedBundle, firstRoot)
    await syncBundleSnapshot(lockedBundle, secondRoot)
    await generateAdminTypes(firstRoot)
    await generateAdminTypes(secondRoot)

    const outputs = [
      'src/modules/http/generated/admin.ts',
      'src/modules/routing/generated/permissions.ts',
      'src/modules/routing/generated/views.ts',
    ]
    for (const output of outputs) {
      expect(await readFile(join(firstRoot, output), 'utf8'))
        .toBe(await readFile(join(secondRoot, output), 'utf8'))
    }

    const transport = await readFile(join(firstRoot, outputs[0]), 'utf8')
    expect(transport).not.toContain('/api/app/')
    expect(transport).not.toContain('/api/canvas/')
  })
})
