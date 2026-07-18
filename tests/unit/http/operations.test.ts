import { describe, expect, it } from 'vitest'
import {
  defineOperation,
  encodeOperationInput,
  renderOperationPath,
  type Operation,
} from '@/modules/http/operations'

function operation(overrides: Partial<Operation<void, unknown>> = {}): Operation<void, unknown> {
  return {
    id: 'test.operation',
    method: 'GET',
    path: '/api/admin/v1/test/{id}',
    auth: 'required',
    timeout: 'interactive',
    replay: 'safe',
    telemetryName: 'test.operation',
    ...overrides,
  }
}

describe('HTTP operation declarations', () => {
  it.each([
    ['empty id', { id: ' ' }],
    ['empty telemetry name', { telemetryName: ' ' }],
  ])('rejects %s', (_name, overrides) => {
    expect(() => defineOperation(operation(overrides))).toThrow(
      'HTTP operation id and telemetryName are required',
    )
  })

  it.each([
    ['relative path', 'api/admin/v1/test'],
    ['query in path', '/api/admin/v1/test?status=1'],
    ['fragment in path', '/api/admin/v1/test#result'],
  ])('rejects a %s', (_name, path) => {
    expect(() => defineOperation(operation({ path }))).toThrow(
      'must declare an absolute path without query or fragment',
    )
  })

  it('rejects replay policies that contradict the HTTP method', () => {
    expect(() => defineOperation(operation({ method: 'POST', replay: 'safe' }))).toThrow(
      'may use safe replay only with GET',
    )
    expect(() => defineOperation(operation({ method: 'GET', replay: 'idempotency-key' }))).toThrow(
      'must not require an idempotency key for GET',
    )
  })

  it('encodes only through the declared encoder', () => {
    const empty = operation({ path: '/api/admin/v1/test' })
    expect(encodeOperationInput(empty, undefined)).toEqual({})

    const encoded = operation({
      path: '/api/admin/v1/test',
      encode: () => ({ query: { active: true } }),
    })
    expect(encodeOperationInput(encoded, undefined)).toEqual({ query: { active: true } })
  })

  it('renders exact path parameters and rejects missing, empty, or unused values', () => {
    expect(renderOperationPath('/users/{id}/roles/{role}', { id: 7, role: '审计员' }))
      .toBe('/users/7/roles/%E5%AE%A1%E8%AE%A1%E5%91%98')
    expect(() => renderOperationPath('/users/{id}')).toThrow('missing path parameter: id')
    expect(() => renderOperationPath('/users/{id}', { id: '' })).toThrow('missing path parameter: id')
    expect(() => renderOperationPath('/users/{id}', { id: 7, role: 3 }))
      .toThrow('unused path parameter: role')
  })
})
