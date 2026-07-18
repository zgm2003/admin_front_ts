import { shallowReadonly, shallowRef } from 'vue'
import { createApiError, isApiError, type ApiError } from '@/modules/http/error'
import type {
  ResourceQuery,
  ResourceQueryOptions,
  ResourceState,
} from './types'

type RequestMode = 'execute' | 'refresh'

function mapResourceError(error: unknown, signal: AbortSignal): ApiError {
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

class ResourceQueryController<TItem, TParams, TPage>
implements ResourceQuery<TItem, TParams, TPage> {
  readonly state: ResourceQuery<TItem, TParams, TPage>['state']

  private readonly mutableState = shallowRef<ResourceState<TItem>>({ kind: 'idle', data: [] })
  private readonly options: ResourceQueryOptions<TItem, TParams, TPage>
  private activeController: AbortController | null = null
  private requestSequence = 0
  private hasLastParams = false
  private lastParams!: TParams
  private disposed = false

  constructor(options: ResourceQueryOptions<TItem, TParams, TPage>) {
    this.options = options
    this.state = shallowReadonly(this.mutableState)
  }

  async execute(params: TParams): Promise<TPage> {
    return this.run(params, 'execute')
  }

  async refresh(): Promise<TPage> {
    this.requireLastParams('refresh')
    return this.run(this.lastParams, 'refresh')
  }

  async retry(): Promise<TPage> {
    this.requireLastParams('retry')
    const mode = this.mutableState.value.data.length > 0 ? 'refresh' : 'execute'
    return this.run(this.lastParams, mode)
  }

  reset(): void {
    if (this.disposed) return
    this.invalidateActiveRequest()
    this.hasLastParams = false
    this.mutableState.value = { kind: 'idle', data: [] }
  }

  dispose(): void {
    if (this.disposed) return
    this.invalidateActiveRequest()
    this.hasLastParams = false
    this.disposed = true
    this.mutableState.value = { kind: 'idle', data: [] }
  }

  private async run(params: TParams, mode: RequestMode): Promise<TPage> {
    this.requireActive()
    this.activeController?.abort(new DOMException('ResourceQuery request superseded', 'AbortError'))
    const controller = new AbortController()
    const requestId = ++this.requestSequence
    this.activeController = controller
    this.hasLastParams = true
    this.lastParams = params
    const visibleData = mode === 'refresh' ? this.mutableState.value.data : []
    this.mutableState.value = mode === 'refresh'
      ? { kind: 'refreshing', data: visibleData, requestId }
      : { kind: 'loading', data: visibleData, requestId }

    try {
      const page = await this.options.request(params, { signal: controller.signal })
      if (!this.owns(requestId)) return page
      const selectedItems = this.options.selectItems(page)
      if (!Array.isArray(selectedItems)) {
        throw new TypeError('ResourceQuery selectItems must return an array')
      }
      const committedParams = this.options.onCommit?.(page, params)
      if (committedParams !== undefined) this.lastParams = committedParams
      const data = [...selectedItems]
      this.mutableState.value = data.length === 0
        ? { kind: 'empty', data: [] }
        : { kind: 'success', data }
      return page
    } catch (error) {
      const mapped = mapResourceError(error, controller.signal)
      if (this.owns(requestId)) {
        this.mutableState.value = { kind: 'error', data: visibleData, error: mapped }
      }
      throw mapped
    } finally {
      if (this.owns(requestId)) this.activeController = null
    }
  }

  private owns(requestId: number): boolean {
    return !this.disposed && requestId === this.requestSequence
  }

  private invalidateActiveRequest(): void {
    this.requestSequence++
    this.activeController?.abort(new DOMException('ResourceQuery request invalidated', 'AbortError'))
    this.activeController = null
  }

  private requireActive(): void {
    if (this.disposed) throw new DOMException('ResourceQuery is disposed', 'InvalidStateError')
  }

  private requireLastParams(action: string): void {
    this.requireActive()
    if (!this.hasLastParams) {
      throw new DOMException(`ResourceQuery cannot ${action} before execute`, 'InvalidStateError')
    }
  }
}

export function createResourceQuery<TItem, TParams, TPage>(
  options: ResourceQueryOptions<TItem, TParams, TPage>,
): ResourceQuery<TItem, TParams, TPage> {
  return new ResourceQueryController(options)
}

export type {
  ResourceQuery,
  ResourceQueryOptions,
  ResourceState,
} from './types'
