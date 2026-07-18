import { describe, expect, it, vi } from 'vitest'
import { isApiError } from '@/modules/http/error'
import { createMutation } from '@/modules/resource-query/mutation'
import { createResourceQuery } from '@/modules/resource-query/query'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise })
  return { promise, resolve }
}

describe('Mutation', () => {
  it('returns canceled without executing when confirmation is declined', async () => {
    const execute = vi.fn()
    const refresh = vi.fn()
    const mutation = createMutation({
      key: (input: { id: number }) => `delete:${input.id}`,
      confirm: vi.fn(async () => false),
      execute,
      invalidate: [{ refresh }],
    })

    await expect(mutation.mutate({ id: 1 })).resolves.toEqual({ kind: 'canceled' })
    expect(execute).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('deduplicates the same pending identity and invalidates after success', async () => {
    const pending = deferred<{ deleted: number }>()
    const queryRequest = vi.fn(async () => ({ items: [{ id: 1 }] }))
    const query = createResourceQuery({
      request: queryRequest,
      selectItems: (page: { items: Array<{ id: number }> }) => page.items,
    })
    await query.execute({ page: 1 })
    const execute = vi.fn(() => pending.promise)
    const mutation = createMutation({
      key: (input: { id: number }) => `delete:${input.id}`,
      execute,
      invalidate: [query],
    })

    const first = mutation.mutate({ id: 1 })
    const duplicate = mutation.mutate({ id: 1 })
    expect(mutation.isPending({ id: 1 })).toBe(true)
    expect(execute).toHaveBeenCalledTimes(1)

    pending.resolve({ deleted: 1 })
    await expect(first).resolves.toEqual({ kind: 'success', data: { deleted: 1 } })
    await expect(duplicate).resolves.toEqual({ kind: 'success', data: { deleted: 1 } })
    expect(queryRequest).toHaveBeenCalledTimes(2)
    expect(mutation.isPending({ id: 1 })).toBe(false)
  })

  it('requires and forwards the configured idempotency key', async () => {
    const execute = vi.fn(async () => 'ok')
    const mutation = createMutation({
      key: (input: { id: number }) => `save:${input.id}`,
      idempotencyKey: (input) => `save-${input.id}`,
      execute,
      invalidate: [],
    })

    await mutation.mutate({ id: 7 })
    expect(execute).toHaveBeenCalledWith(
      { id: 7 },
      { signal: expect.any(AbortSignal), idempotencyKey: 'save-7' },
    )

    const invalid = createMutation({
      key: (input: { id: number }) => `save:${input.id}`,
      idempotencyKey: () => '',
      execute,
      invalidate: [],
    })
    await expect(invalid.mutate({ id: 8 })).rejects.toMatchObject({
      kind: 'internal',
      code: 'mutation.idempotency_key_invalid',
    })
  })

  it('maps an untyped execution failure to a typed ApiError', async () => {
    const mutation = createMutation({
      key: (input: { id: number }) => `save:${input.id}`,
      execute: async () => { throw new Error('raw failure') },
      invalidate: [],
    })

    const error = await mutation.mutate({ id: 1 }).catch((reason: unknown) => reason)
    expect(isApiError(error)).toBe(true)
    expect(error).toMatchObject({ kind: 'internal', code: 'http.internal' })
  })

  it('rejects invalid mutation keys before execution', async () => {
    const execute = vi.fn()
    const blank = createMutation({
      key: () => ' ',
      execute,
      invalidate: [],
    })

    await expect(blank.mutate({ id: 1 })).rejects.toMatchObject({
      kind: 'internal',
      code: 'mutation.key_invalid',
    })
    expect(execute).not.toHaveBeenCalled()
  })

  it('aborts pending work on dispose and rejects later mutations', async () => {
    const pending = deferred<string>()
    const execute = vi.fn((_input, options: { signal: AbortSignal }) => new Promise<string>((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true })
      pending.promise.then(resolve, reject)
    }))
    const mutation = createMutation({
      key: (input: { id: number }) => `save:${input.id}`,
      execute,
      invalidate: [],
    })

    const flight = mutation.mutate({ id: 1 })
    mutation.dispose()
    mutation.dispose()

    await expect(flight).rejects.toMatchObject({ kind: 'canceled', code: 'http.canceled' })
    await expect(mutation.mutate({ id: 2 })).rejects.toThrow(/disposed/i)
  })
})
