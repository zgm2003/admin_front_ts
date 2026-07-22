import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { adminOperations, type AdminOperationInput } from '@/modules/http/generated/operations'
import { encodeOperationInput } from '@/modules/http/operations'

const temporaryRoots: string[] = []
const lockedBundle = resolve(process.cwd(), 'contracts/backend/admin/v1')
const httpMethods = ['get', 'post', 'put', 'patch', 'delete'] as const

type JsonObject = Record<string, unknown>

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredObject(value: unknown, label: string): JsonObject {
  if (!isJsonObject(value)) throw new Error(`${label} must be an object`)
  return value
}

async function readLockedObject(relativePath: string): Promise<JsonObject> {
  return requiredObject(
    JSON.parse(await readFile(join(lockedBundle, relativePath), 'utf8')) as unknown,
    relativePath,
  )
}

function collectOperationIds(openapi: JsonObject): string[] {
  const paths = requiredObject(openapi.paths, 'openapi.paths')
  return Object.values(paths).flatMap((pathItem) => {
    if (!isJsonObject(pathItem)) return []
    return httpMethods.flatMap((method) => {
      const operation = pathItem[method]
      if (!isJsonObject(operation) || typeof operation.operationId !== 'string') return []
      return [operation.operationId]
    })
  })
}

function collectStringEnums(value: unknown): string[][] {
  if (Array.isArray(value)) return value.flatMap(collectStringEnums)
  if (!isJsonObject(value)) return []

  const ownEnum = Array.isArray(value.enum) && value.enum.every((item) => typeof item === 'string')
    ? [value.enum]
    : []
  return [...ownEnum, ...Object.values(value).flatMap(collectStringEnums)]
}

function schemaProperties(schemas: JsonObject, schemaName: string): string[] {
  const schema = requiredObject(schemas[schemaName], `schema ${schemaName}`)
  return Object.keys(requiredObject(schema.properties, `schema ${schemaName}.properties`))
}

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

  it('retires Prompt management while retaining all seven auth-platform operations', async () => {
    const openapi = await readLockedObject('openapi.json')
    const paths = requiredObject(openapi.paths, 'openapi.paths')
    const operationIds = collectOperationIds(openapi)
    const authPlatformOperationIds = operationIds
      .filter((operationId) => operationId.includes('_auth_platforms'))
      .sort()

    expect(Object.keys(paths).filter((path) => path.startsWith('/api/admin/v1/ai-prompts'))).toEqual([])
    expect(authPlatformOperationIds).toEqual([
      'delete_api_admin_v1_auth_platforms',
      'delete_api_admin_v1_auth_platforms_id',
      'get_api_admin_v1_auth_platforms',
      'get_api_admin_v1_auth_platforms_page_init',
      'patch_api_admin_v1_auth_platforms_id_status',
      'post_api_admin_v1_auth_platforms',
      'put_api_admin_v1_auth_platforms_id',
    ])

    const permissions = await readLockedObject('permissions.json')
    const permissionCodes = permissions.permission_codes
    expect(Array.isArray(permissionCodes)).toBe(true)
    expect((permissionCodes as unknown[]).filter(
      (code) => typeof code === 'string' && code.startsWith('ai_prompt_'),
    )).toEqual([])

    const views = await readLockedObject('views.json')
    const viewKeys = collectStringEnums(views).flat()
    expect(viewKeys).toContain('permission/authPlatform')
    expect(viewKeys).not.toContain('ai/prompts')
  })

  it('publishes every component demo view accepted from users/me', async () => {
    const views = await readLockedObject('views.json')
    const viewKeys = collectStringEnums(views).flat()

    expect(viewKeys).toEqual(expect.arrayContaining([
      'component/display',
      'component/download',
      'component/effect',
      'component/form',
      'component/upload',
    ]))
  })

  it('exposes only current Admin platform enums while preserving platform-kernel fields', async () => {
    const openapi = await readLockedObject('openapi.json')
    const platformEnums = collectStringEnums(openapi)
      .filter((values) => values.some((value) => ['all', 'admin', 'app', 'canvas'].includes(value)))

    expect(platformEnums).toContainEqual(['admin'])
    expect(platformEnums).toContainEqual(['all', 'admin'])
    for (const values of platformEnums) {
      expect(values).not.toContain('app')
      expect(values).not.toContain('canvas')
    }

    const components = requiredObject(openapi.components, 'openapi.components')
    const schemas = requiredObject(components.schemas, 'openapi.components.schemas')
    const requiredFields: Readonly<Record<string, readonly string[]>> = {
      AIRunDetail: ['platform'],
      Go_internal_module_auth_LoginLogListItem_Output: ['platform', 'platform_name'],
      Go_internal_module_auth_LoginLogPageInitDict_Output: ['platformArr'],
      Go_internal_module_auth_SessionListItem_Output: ['platform', 'platform_name'],
      Go_internal_module_auth_SessionPageInitDict_Output: ['platformArr'],
      Go_internal_module_auth_SessionStatsResponse_Output: ['platform_distribution'],
      Go_internal_module_notification_task_InitDict_Output: ['platformArr'],
      Go_internal_module_notification_task_ListItem_Output: ['platform', 'platform_text'],
      Go_internal_module_permission_PermissionDict_Output: ['permission_platform_arr'],
      Go_internal_module_permission_PermissionTreeNode_Output: ['platform'],
      Go_internal_module_role_InitDict_Output: ['permission_platform_arr'],
      post_api_admin_v1_notification_tasks_Request: ['platform'],
      post_api_admin_v1_permissions_Request: ['platform'],
      put_api_admin_v1_permissions_id_Request: ['platform'],
    }

    for (const [schemaName, fields] of Object.entries(requiredFields)) {
      expect(schemaProperties(schemas, schemaName)).toEqual(expect.arrayContaining(fields))
    }
  })
})
