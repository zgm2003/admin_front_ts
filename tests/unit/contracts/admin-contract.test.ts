import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
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

function schemaReference(container: JsonObject, label: string): string {
  const content = requiredObject(container.content, `${label}.content`)
  const media = requiredObject(content['application/json'], `${label}.content.application/json`)
  const schema = requiredObject(media.schema, `${label}.schema`)
  if (typeof schema.$ref !== 'string') throw new Error(`${label}.schema.$ref must be a string`)
  return schema.$ref
}

function expectNullableProperty(schema: JsonObject, field: string) {
  const properties = requiredObject(schema.properties, `schema.properties`)
  const property = requiredObject(properties[field], `schema.properties.${field}`)
  expect(Array.isArray(property.anyOf)).toBe(true)
  expect((property.anyOf as unknown[]).some(
    (variant) => isJsonObject(variant) && variant.type === 'null',
  )).toBe(true)
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
  it('publishes the exact AI consumer interaction operations and fields', async () => {
    const openapi = await readLockedObject('openapi.json')
    const paths = requiredObject(openapi.paths, 'openapi.paths')
    const components = requiredObject(openapi.components, 'openapi.components')
    const schemas = requiredObject(components.schemas, 'openapi.components.schemas')
    const operations = [
      {
        method: 'post',
        path: '/api/admin/v1/ai-conversations/{id}/messages/{message_id}/revisions',
        operationId: 'post_api_admin_v1_ai_conversations_id_messages_message_id_revisions',
        status: '202',
        request: 'AIMessageRevisionRequest',
        response: 'AIMessageSendSuccessEnvelope',
        pathIds: ['id', 'message_id'],
      },
      {
        method: 'post',
        path: '/api/admin/v1/ai-conversations/{id}/messages/{message_id}/regenerations',
        operationId: 'post_api_admin_v1_ai_conversations_id_messages_message_id_regenerations',
        status: '202',
        request: 'AIMessageRegenerationRequest',
        response: 'AIMessageSendSuccessEnvelope',
        pathIds: ['id', 'message_id'],
      },
      {
        method: 'delete',
        path: '/api/admin/v1/ai-conversations/{id}/messages',
        operationId: 'delete_api_admin_v1_ai_conversations_id_messages',
        status: '200',
        request: 'AIMessageDeleteRequest',
        response: 'AIMessageDeleteSuccessEnvelope',
        pathIds: ['id'],
      },
      {
        method: 'put',
        path: '/api/admin/v1/ai-conversations/{id}/read-cursor',
        operationId: 'put_api_admin_v1_ai_conversations_id_read_cursor',
        status: '200',
        request: 'AIConversationReadCursorRequest',
        response: 'AIConversationReadCursorSuccessEnvelope',
        pathIds: ['id'],
      },
      {
        method: 'put',
        path: '/api/admin/v1/ai-runs/{id}/user-feedback',
        operationId: 'put_api_admin_v1_ai_runs_id_user_feedback',
        status: '200',
        request: 'AIRunUserFeedbackRequest',
        response: 'AIRunUserFeedbackSuccessEnvelope',
        pathIds: ['id'],
      },
    ] as const

    for (const expected of operations) {
      const pathItem = requiredObject(paths[expected.path], `path ${expected.path}`)
      const operation = requiredObject(pathItem[expected.method], `${expected.method} ${expected.path}`)
      expect(operation.operationId).toBe(expected.operationId)
      expect(requiredObject(operation['x-admin-access'], 'x-admin-access')).toEqual({
        kind: 'authenticated',
      })

      const requestBody = requiredObject(operation.requestBody, `${expected.operationId}.requestBody`)
      expect(requestBody.required).toBe(true)
      expect(schemaReference(requestBody, `${expected.operationId}.requestBody`))
        .toBe(`#/components/schemas/${expected.request}`)

      const responses = requiredObject(operation.responses, `${expected.operationId}.responses`)
      const response = requiredObject(responses[expected.status], `${expected.operationId}.responses`)
      expect(schemaReference(response, `${expected.operationId}.response`))
        .toBe(`#/components/schemas/${expected.response}`)
      if (expected.status === '202') expect(responses['200']).toBeUndefined()

      const parameters = operation.parameters
      expect(Array.isArray(parameters)).toBe(true)
      const pathParameters = (parameters as unknown[])
        .map((parameter) => requiredObject(parameter, `${expected.operationId}.parameter`))
        .filter((parameter) => parameter.in === 'path')
      expect(pathParameters.map((parameter) => parameter.name).sort()).toEqual(expected.pathIds)
      for (const parameter of pathParameters) {
        expect(parameter.required).toBe(true)
        expect(requiredObject(parameter.schema, `${expected.operationId}.path schema`))
          .toMatchObject({ type: 'integer', minimum: 1 })
      }
    }

    expect(Object.keys(adminOperations)).toEqual(expect.arrayContaining(
      operations.map((operation) => operation.operationId),
    ))

    const exactSchemas: Readonly<Record<string, {
      properties: readonly string[]
      required: readonly string[]
    }>> = {
      AIMessageRevisionRequest: {
        properties: ['attachments', 'content', 'request_id'],
        required: ['content', 'request_id'],
      },
      AIMessageRegenerationRequest: { properties: ['request_id'], required: ['request_id'] },
      AIMessageDeleteRequest: { properties: ['ids'], required: ['ids'] },
      AIMessageDeleteResult: { properties: ['deleted_ids'], required: ['deleted_ids'] },
      AIConversationReadCursorRequest: { properties: ['message_id'], required: ['message_id'] },
      AIConversationReadCursorResult: {
        properties: ['conversation_id', 'last_read_message_id', 'unread_count'],
        required: ['conversation_id', 'last_read_message_id', 'unread_count'],
      },
      AIRunUserFeedbackRequest: { properties: ['liked'], required: ['liked'] },
      AIRunUserFeedbackResult: {
        properties: ['id', 'liked', 'liked_at'],
        required: ['id', 'liked', 'liked_at'],
      },
    }
    for (const [schemaName, expected] of Object.entries(exactSchemas)) {
      const schema = requiredObject(schemas[schemaName], `schema ${schemaName}`)
      expect(schema.additionalProperties).toBe(false)
      expect(schemaProperties(schemas, schemaName).sort()).toEqual([...expected.properties].sort())
      expect([...(schema.required as string[])].sort()).toEqual([...expected.required].sort())
    }

    const conversation = requiredObject(schemas.AIConversationItem, 'AIConversationItem')
    expect(schemaProperties(schemas, 'AIConversationItem')).toContain('unread_count')
    expect(conversation.required).toEqual(expect.arrayContaining(['unread_count']))

    const message = requiredObject(schemas.AIMessageItem, 'AIMessageItem')
    expect(message.required).toEqual(expect.arrayContaining(['paired_message_id', 'run_id', 'liked']))
    expectNullableProperty(message, 'paired_message_id')
    expectNullableProperty(message, 'run_id')
    expect(requiredObject(requiredObject(message.properties, 'AIMessageItem.properties').liked, 'liked'))
      .toMatchObject({ type: 'boolean' })

    const deletedIds = requiredObject(
      requiredObject(requiredObject(schemas.AIMessageDeleteResult, 'AIMessageDeleteResult').properties, 'properties').deleted_ids,
      'AIMessageDeleteResult.deleted_ids',
    )
    expect(deletedIds).toMatchObject({ minItems: 1, uniqueItems: true })
    expect(deletedIds.description).toMatch(/ascending/)

    const feedback = requiredObject(schemas.AIRunUserFeedbackResult, 'AIRunUserFeedbackResult')
    expectNullableProperty(feedback, 'liked_at')
    const runDetail = requiredObject(schemas.AIRunDetail, 'AIRunDetail')
    expect(runDetail.required).toEqual(expect.arrayContaining(['liked', 'liked_at']))
    expectNullableProperty(runDetail, 'liked_at')
    const runListItem = requiredObject(schemas.AIRunListItem, 'AIRunListItem')
    expect(runListItem.required).toEqual(expect.arrayContaining(['liked', 'liked_at']))
    expectNullableProperty(runListItem, 'liked_at')

    const cancel = requiredObject(schemas.AIMessageCancelResult, 'AIMessageCancelResult')
    const cancelProperties = requiredObject(cancel.properties, 'AIMessageCancelResult.properties')
    expect(requiredObject(cancelProperties.status, 'AIMessageCancelResult.status').enum)
      .toEqual(['stopped', 'already_terminal'])

    const recharge = requiredObject(
      schemas.Go_internal_module_payment_RechargePageInitResponse_Output,
      'RechargePageInitResponse',
    )
    expect(schemaProperties(schemas, 'Go_internal_module_payment_RechargePageInitResponse_Output'))
      .not.toContain('recent')
    expect(recharge.additionalProperties).toBe(false)
  })

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

  it('preserves the watched snapshot directory while refreshing its contents', async () => {
    const frontendRoot = await createTemporaryRoot('contract-refresh')
    const destinationRoot = join(frontendRoot, 'contracts/backend/admin/v1')
    await mkdir(destinationRoot, { recursive: true })
    await writeFile(join(destinationRoot, 'stale.json'), '{}\n', 'utf8')
    const directoryIdentity = (await stat(destinationRoot)).ino
    const { syncBundleSnapshot } = await import('../../../scripts/sync-admin-contract.mjs')

    await syncBundleSnapshot(lockedBundle, frontendRoot)

    expect((await stat(destinationRoot)).ino).toBe(directoryIdentity)
    await expect(readFile(join(destinationRoot, 'stale.json'))).rejects.toMatchObject({ code: 'ENOENT' })
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
