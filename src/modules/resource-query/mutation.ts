import { createApiError, isApiError, type ApiError } from '@/modules/http/error'
import type { ResourceQuery } from './types'

export interface MutationExecutionOptions {
  readonly signal: AbortSignal
  readonly idempotencyKey?: string
}

export interface MutationSpec<TInput, TOutput> {
  key(input: TInput): string
  confirm?: (input: TInput) => Promise<boolean>
  idempotencyKey?: (input: TInput) => string
  execute(input: TInput, options: MutationExecutionOptions): Promise<TOutput>
  invalidate: readonly Pick<ResourceQuery<unknown, unknown, unknown>, 'refresh'>[]
}

export type MutationResult<TOutput> =
  | { readonly kind: 'canceled' }
  | { readonly kind: 'success'; readonly data: TOutput }

export interface Mutation<TInput, TOutput> {
  mutate(input: TInput): Promise<MutationResult<TOutput>>
  isPending(input: TInput): boolean
  cancel(): void
  dispose(): void
}

interface PendingMutation<TOutput> {
  readonly controller: AbortController
  readonly flight: Promise<MutationResult<TOutput>>
}

function mutationError(error: unknown, signal: AbortSignal): ApiError {
  if (isApiError(error)) return error
  if (signal.aborted) {
    return createApiError({
      kind: 'canceled',
      code: 'http.canceled',
      retryable: false,
      messageKey: 'http.canceled',
      cause: signal.reason ?? error,
    })
  }
  return createApiError({
    kind: 'internal',
    code: 'http.internal',
    retryable: false,
    messageKey: 'http.internal',
    cause: error,
  })
}

function invalidConfiguration(code: string, message: string): ApiError {
  return createApiError({
    kind: 'internal',
    code,
    retryable: false,
    messageKey: code,
    message,
  })
}

class MutationController<TInput, TOutput> implements Mutation<TInput, TOutput> {
  private readonly spec: MutationSpec<TInput, TOutput>
  private readonly pending = new Map<string, PendingMutation<TOutput>>()
  private readonly canceled = new WeakSet<AbortController>()
  private disposed = false

  constructor(spec: MutationSpec<TInput, TOutput>) {
    this.spec = spec
  }

  mutate(input: TInput): Promise<MutationResult<TOutput>> {
    if (this.disposed) {
      return Promise.reject(new DOMException('Mutation is disposed', 'InvalidStateError'))
    }
    let key: string
    try {
      key = this.mutationKey(input)
    } catch (error) {
      return Promise.reject(mutationError(error, new AbortController().signal))
    }
    const active = this.pending.get(key)
    if (active) return active.flight

    const controller = new AbortController()
    const flight = this.run(input, controller).finally(() => {
      if (this.pending.get(key)?.flight === flight) this.pending.delete(key)
    })
    this.pending.set(key, { controller, flight })
    return flight
  }

  isPending(input: TInput): boolean {
    return this.pending.has(this.mutationKey(input))
  }

  cancel(): void {
    for (const pending of this.pending.values()) {
      this.canceled.add(pending.controller)
      pending.controller.abort(new DOMException('Mutation canceled', 'AbortError'))
    }
    this.pending.clear()
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    for (const pending of this.pending.values()) {
      pending.controller.abort(new DOMException('Mutation disposed', 'AbortError'))
    }
    this.pending.clear()
  }

  private async run(
    input: TInput,
    controller: AbortController,
  ): Promise<MutationResult<TOutput>> {
    try {
      if (this.spec.confirm && !(await this.spec.confirm(input))) return { kind: 'canceled' }
      if (controller.signal.aborted) throw controller.signal.reason
      const idempotencyKey = this.resolveIdempotencyKey(input)
      const options = idempotencyKey === undefined
        ? { signal: controller.signal }
        : { signal: controller.signal, idempotencyKey }
      const data = await this.spec.execute(input, options)
      if (controller.signal.aborted) throw controller.signal.reason
      await Promise.all(this.spec.invalidate.map((query) => query.refresh()))
      return { kind: 'success', data }
    } catch (error) {
      if (this.canceled.has(controller)) return { kind: 'canceled' }
      throw mutationError(error, controller.signal)
    }
  }

  private mutationKey(input: TInput): string {
    const key = this.spec.key(input)
    if (typeof key !== 'string' || !/\S/.test(key)) {
      throw invalidConfiguration('mutation.key_invalid', 'Mutation key must be a non-empty string')
    }
    return key
  }

  private resolveIdempotencyKey(input: TInput): string | undefined {
    if (!this.spec.idempotencyKey) return undefined
    const key = this.spec.idempotencyKey(input)
    if (typeof key !== 'string' || !/\S/.test(key)) {
      throw invalidConfiguration(
        'mutation.idempotency_key_invalid',
        'Mutation idempotency key must be a non-empty string',
      )
    }
    return key
  }
}

export function createMutation<TInput, TOutput>(
  spec: MutationSpec<TInput, TOutput>,
): Mutation<TInput, TOutput> {
  return new MutationController(spec)
}
