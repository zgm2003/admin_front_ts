import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import openapiTS, { astToString } from 'openapi-typescript'
import { validateBundle } from './sync-admin-contract.mjs'

const adminTypesOutput = 'src/modules/http/generated/admin.ts'
const adminOperationsOutput = 'src/modules/http/generated/operations.ts'
const permissionsOutput = 'src/modules/routing/generated/permissions.ts'
const viewsOutput = 'src/modules/routing/generated/views.ts'

export const generatedAdminOutputs = Object.freeze([
  adminTypesOutput,
  adminOperationsOutput,
  permissionsOutput,
  viewsOutput,
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

function responseContract(operation, label) {
  const successful = Object.entries(operation?.responses ?? {})
    .filter(([status]) => /^2\d\d$/.test(status))
    .sort(([left], [right]) => Number(left) - Number(right))
  for (const [, response] of successful) {
    const schema = response?.content?.['application/json']?.schema
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) continue
    const reference = schema.$ref
    if (typeof reference !== 'string' || !reference.startsWith('#/components/schemas/')) continue
    return { reference, schemaName: reference.slice('#/components/schemas/'.length) }
  }
  throw new Error(`${label} has no JSON success response schema`)
}

function fieldCompleteOperations(openapi) {
  const components = openapi.components?.schemas ?? {}
  const methods = new Set(['get', 'post', 'put', 'patch', 'delete'])
  const operations = []
  const operationIDs = new Set()
  for (const [path, pathItem] of Object.entries(openapi.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      if (!methods.has(method) || !operation || typeof operation !== 'object') continue
      const operationID = operation.operationId
      if (typeof operationID !== 'string' || !operationID) {
        throw new Error(`${method.toUpperCase()} ${path} has no operationId`)
      }
      if (operationIDs.has(operationID)) throw new Error(`duplicate operationId ${operationID}`)
      operationIDs.add(operationID)
      let response
      try {
        response = responseContract(operation, `${method.toUpperCase()} ${path}`)
      } catch {
        continue
      }
      if (response.schemaName === 'SuccessEnvelope') continue
      const envelope = components[response.schemaName]
      const dataSchema = envelope?.properties?.data
      if (!envelope || typeof envelope !== 'object' || !dataSchema || typeof dataSchema !== 'object') {
        throw new Error(`${operationID} response envelope ${response.schemaName} has no data schema`)
      }
      operations.push({
        id: operationID,
        method: method.toUpperCase(),
        path,
        auth: operation['x-admin-access']?.kind === 'public' ? 'public' : 'required',
        replay: method === 'get' ? 'safe' : 'never',
        dataSchema,
        operation,
      })
    }
  }
  return operations.sort((left, right) => left.id.localeCompare(right.id))
}

function referencedComponents(rootSchemas, components) {
  const names = new Set()
  function visit(value) {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (!value || typeof value !== 'object') return
    const reference = value.$ref
    if (typeof reference === 'string' && reference.startsWith('#/components/schemas/')) {
      const name = reference.slice('#/components/schemas/'.length)
      if (!names.has(name)) {
        const component = components[name]
        if (!component) throw new Error(`missing referenced component ${name}`)
        names.add(name)
        visit(component)
      }
    }
    Object.values(value).forEach(visit)
  }
  rootSchemas.forEach(visit)
  return Object.fromEntries([...names].sort().map((name) => [name, components[name]]))
}

function hasEncodedInput(operation) {
  const parameters = operation.operation.parameters ?? []
  return parameters.some((parameter) => parameter?.in === 'path' || parameter?.in === 'query')
    || Boolean(operation.operation.requestBody)
}

function operationSource(operation) {
  const input = `AdminOperationInput<${JSON.stringify(operation.id)}>`
  const output = `AdminOperationOutput<${JSON.stringify(operation.id)}>`
  return [
    `  ${JSON.stringify(operation.id)}: defineOperation<${input}, ${output}>({`,
    `    id: ${JSON.stringify(operation.id)},`,
    `    method: ${JSON.stringify(operation.method)},`,
    `    path: ${JSON.stringify(operation.path)},`,
    `    auth: ${JSON.stringify(operation.auth)},`,
    "    timeout: 'interactive',",
    `    replay: ${JSON.stringify(operation.replay)},`,
    `    responseSchema: schemaCompiler.compile<${output}>(responseDataSchemas[${JSON.stringify(operation.id)}]),`,
    `    telemetryName: ${JSON.stringify(`admin.${operation.id.replaceAll('_', '.')}`)},`,
    ...(hasEncodedInput(operation) ? ['    encode: (input) => input,'] : []),
    '  }),',
  ].join('\n')
}

function generatedOperationsSource(openapi, manifestSha) {
  const operations = fieldCompleteOperations(openapi)
  const responseSchemas = Object.fromEntries(operations.map((operation) => [operation.id, operation.dataSchema]))
  const componentSchemas = referencedComponents(
    operations.map((operation) => operation.dataSchema),
    openapi.components?.schemas ?? {},
  )
  return [
    header(manifestSha),
    "import { createContractSchemaCompiler, type ContractSchema } from '../contract-schema'",
    "import { defineOperation } from '../operations'",
    "import type { operations } from './admin'",
    '',
    `const contractSchemas = ${JSON.stringify(componentSchemas, null, 2)} as const satisfies Readonly<Record<string, ContractSchema>>`,
    '',
    `const responseDataSchemas = ${JSON.stringify(responseSchemas, null, 2)} as const satisfies Readonly<Record<string, ContractSchema>>`,
    '',
    'export type AdminOperationId = keyof typeof responseDataSchemas',
    'type OperationContract<K extends AdminOperationId> = operations[K]',
    "type ParameterName = 'path' | 'query'",
    'type ParametersContract<K extends AdminOperationId> = OperationContract<K> extends { parameters: infer P } ? P : never',
    'type ParameterField<K extends AdminOperationId, N extends ParameterName> =',
    '  ParametersContract<K> extends Record<N, infer Value>',
    '    ? { readonly [P in N]: Value }',
    '    : ParametersContract<K> extends { readonly [P in N]?: infer Value }',
    '      ? [Exclude<Value, undefined>] extends [never]',
    '        ? Record<never, never>',
    '        : { readonly [P in N]?: Exclude<Value, undefined> }',
    '      : Record<never, never>',
    'type RequestBodyField<K extends AdminOperationId> =',
    "  OperationContract<K> extends { requestBody: { content: { 'application/json': infer Body } } }",
    '    ? { readonly body: Body }',
    "    : OperationContract<K> extends { requestBody?: { content: { 'application/json': infer Body } } }",
    '      ? { readonly body?: Body }',
    '      : Record<never, never>',
    'type ResponsesContract<K extends AdminOperationId> = OperationContract<K> extends { responses: infer Responses } ? Responses : never',
    "type SuccessResponse<K extends AdminOperationId> = ResponsesContract<K>[Exclude<keyof ResponsesContract<K>, 'default'>]",
    'type SuccessEnvelope<K extends AdminOperationId> = SuccessResponse<K> extends { content: { \'application/json\': infer Envelope } } ? Envelope : never',
    '',
    'export type AdminOperationInput<K extends AdminOperationId> =',
    "  ParameterField<K, 'path'> & ParameterField<K, 'query'> & RequestBodyField<K>",
    'export type AdminOperationOutput<K extends AdminOperationId> =',
    '  SuccessEnvelope<K> extends { data: infer Data } ? Data : never',
    '',
    'const schemaCompiler = createContractSchemaCompiler(contractSchemas)',
    '',
    'export const adminOperations = {',
    ...operations.map(operationSource),
    '} as const',
    '',
  ].join('\n')
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
    adminTypesOutput,
    `${header(manifestSha)}${astToString(openapiAst)}`,
  )

  await writeGenerated(
    root,
    adminOperationsOutput,
    generatedOperationsSource(openapi, manifestSha),
  )

  const permissions = JSON.parse(await readFile(join(contractRoot, 'permissions.json'), 'utf8'))
  const permissionCodes = assertSortedUniqueStrings(permissions.permission_codes, 'permission_codes')
  await writeGenerated(root, permissionsOutput, [
    header(manifestSha),
    literalArray('permissionCodes', permissionCodes),
    'export type PermissionCode = typeof permissionCodes[number]',
    '',
    'export const permissionCodeSet: ReadonlySet<PermissionCode> = new Set(permissionCodes)',
    '',
  ].join('\n'))

  const views = JSON.parse(await readFile(join(contractRoot, 'views.json'), 'utf8'))
  const viewRecords = Array.isArray(views.views) ? views.views : []
  const viewKeys = assertSortedUniqueStrings(
    viewRecords.map((view) => view?.view_key),
    'view keys',
  )
  const recordsByKey = new Map(viewRecords.map((view) => [view.view_key, view]))
  const descriptorLines = viewKeys.map((key) => {
    const view = recordsByKey.get(key)
    if (
      !view
      || typeof view.path !== 'string'
      || typeof view.i18n_key !== 'string'
      || (view.show_menu !== 1 && view.show_menu !== 2)
      || !Array.isArray(view.permission_codes)
      || view.permission_codes.some((code) => typeof code !== 'string')
    ) {
      throw new Error(`view descriptor ${key} violates the Admin view contract`)
    }
    return `  ${JSON.stringify(key)}: ${JSON.stringify({
      path: view.path,
      titleKey: view.i18n_key,
      showMenu: view.show_menu === 1,
      permissionCodes: view.permission_codes,
    })},`
  })
  await writeGenerated(root, viewsOutput, [
    header(manifestSha),
    literalArray('backendViewKeys', viewKeys),
    'export type BackendViewKey = typeof backendViewKeys[number]',
    '',
    'export const backendViewKeySet: ReadonlySet<BackendViewKey> = new Set(backendViewKeys)',
    '',
    'export const backendViewDescriptors = {',
    ...descriptorLines,
    '} as const',
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
