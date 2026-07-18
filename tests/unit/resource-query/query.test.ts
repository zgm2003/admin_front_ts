import { describe, expect, it, vi } from 'vitest'
import { createApiError } from '@/modules/http/error'
import { createResourceQuery } from '@/modules/resource-query/query'

interface Item { readonly id: number }
interface Params { readonly term: string }
interface Page { readonly items: readonly Item[] }

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function resource(request: (params: Params, context: { signal: AbortSignal }) => Promise<Page>) {
  return createResourceQuery<Item, Params, Page>({
    request,
    selectItems: (page) => page.items,
  })
}

describe('ResourceQuery', () => {
  it('aborts the previous request and commits only the latest reverse-order response', async () => {
    const first = deferred<Page>()
    const second = deferred<Page>()
    const signals: AbortSignal[] = []
    const request = vi.fn((_params: Params, context: { signal: AbortSignal }) => {
      signals.push(context.signal)
      return signals.length === 1 ? first.promise : second.promise
    })
    const query = resource(request)

    const requestA = query.execute({ term: 'A' })
    const requestB = query.execute({ term: 'B' })
    expect(signals[0]?.aborted).toBe(true)
    expect(query.state.value).toMatchObject({ kind: 'loading', requestId: 2, data: [] })

    second.resolve({ items: [{ id: 2 }] })
    await expect(requestB).resolves.toEqual({ items: [{ id: 2 }] })
    expect(query.state.value).toEqual({ kind: 'success', data: [{ id: 2 }] })

    first.resolve({ items: [{ id: 1 }] })
    await expect(requestA).resolves.toEqual({ items: [{ id: 1 }] })
    expect(query.state.value).toEqual({ kind: 'success', data: [{ id: 2 }] })
  })

  it('preserves successful data while refresh owns loading', async () => {
    const refresh = deferred<Page>()
    const request = vi.fn()
      .mockResolvedValueOnce({ items: [{ id: 1 }] })
      .mockImplementationOnce(() => refresh.promise)
    const query = resource(request)

    await query.execute({ term: 'current' })
    const refreshFlight = query.refresh()
    expect(query.state.value).toMatchObject({ kind: 'refreshing', data: [{ id: 1 }] })

    refresh.resolve({ items: [{ id: 2 }] })
    await expect(refreshFlight).resolves.toEqual({ items: [{ id: 2 }] })
    expect(query.state.value).toEqual({ kind: 'success', data: [{ id: 2 }] })
  })

  it('distinguishes empty and typed error states and retries the last parameters', async () => {
    const failure = createApiError({
      kind: 'network',
      code: 'http.network',
      retryable: true,
      messageKey: 'http.network',
    })
    const request = vi.fn()
      .mockResolvedValueOnce({ items: [] })
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce({ items: [{ id: 3 }] })
    const query = resource(request)

    await query.execute({ term: 'empty' })
    expect(query.state.value).toEqual({ kind: 'empty', data: [] })

    await expect(query.execute({ term: 'retry-me' })).rejects.toBe(failure)
    expect(query.state.value).toEqual({ kind: 'error', data: [], error: failure })

    await expect(query.retry()).resolves.toEqual({ items: [{ id: 3 }] })
    expect(request).toHaveBeenLastCalledWith({ term: 'retry-me' }, { signal: expect.any(AbortSignal) })
    expect(query.state.value).toEqual({ kind: 'success', data: [{ id: 3 }] })
  })

  it('invalidates in-flight ownership on reset and rejects work after dispose', async () => {
    const pending = deferred<Page>()
    let signal: AbortSignal | undefined
    const query = resource((_params, context) => {
      signal = context.signal
      return pending.promise
    })

    const flight = query.execute({ term: 'old' })
    query.reset()
    expect(signal?.aborted).toBe(true)
    expect(query.state.value).toEqual({ kind: 'idle', data: [] })

    pending.resolve({ items: [{ id: 1 }] })
    await flight
    expect(query.state.value).toEqual({ kind: 'idle', data: [] })

    query.dispose()
    await expect(query.execute({ term: 'new' })).rejects.toThrow(/disposed/i)
  })

  it('requires an initial execution before refresh or retry', async () => {
    const query = resource(vi.fn())

    await expect(query.refresh()).rejects.toThrow(/before execute/i)
    await expect(query.retry()).rejects.toThrow(/before execute/i)
  })

  it('preserves data for a failed refresh and retries in refresh mode', async () => {
    const failure = new Error('temporary failure')
    const request = vi.fn()
      .mockResolvedValueOnce({ items: [{ id: 1 }] })
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce({ items: [{ id: 2 }] })
    const query = resource(request)

    await query.execute({ term: 'current' })
    await expect(query.refresh()).rejects.toMatchObject({ kind: 'internal' })
    expect(query.state.value).toMatchObject({ kind: 'error', data: [{ id: 1 }] })

    const retry = query.retry()
    expect(query.state.value).toMatchObject({ kind: 'refreshing', data: [{ id: 1 }] })
    await expect(retry).resolves.toEqual({ items: [{ id: 2 }] })
  })

  it('commits normalized parameters and rejects a non-array item selector', async () => {
    const request = vi.fn(async (params: Params) => ({ items: [{ id: params.term.length }] }))
    const query = createResourceQuery<Item, Params, Page>({
      request,
      selectItems: (page) => page.items,
      onCommit: (_page, params) => ({ term: params.term.trim() }),
    })
    await query.execute({ term: ' normalized ' })
    await query.refresh()
    expect(request).toHaveBeenLastCalledWith(
      { term: 'normalized' },
      { signal: expect.any(AbortSignal) },
    )

    const invalid = createResourceQuery<Item, Params, Page>({
      request: async () => ({ items: [] }),
      selectItems: () => null as never,
    })
    await expect(invalid.execute({ term: 'invalid' })).rejects.toMatchObject({
      kind: 'internal',
      code: 'http.internal',
    })
  })

  it('maps request aborts to canceled errors and makes reset/dispose idempotent', async () => {
    const pending = deferred<Page>()
    const query = resource(() => pending.promise)
    const flight = query.execute({ term: 'cancel' })

    query.dispose()
    query.dispose()
    query.reset()
    pending.reject(new Error('aborted'))

    await expect(flight).rejects.toMatchObject({ kind: 'canceled', code: 'http.canceled' })
  })
})
