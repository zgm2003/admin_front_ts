import type { ShallowRef } from 'vue'
import type { ApiError } from '@/modules/http/error'

export type ResourceState<T> =
  | { readonly kind: 'idle'; readonly data: readonly T[] }
  | { readonly kind: 'loading'; readonly data: readonly T[]; readonly requestId: number }
  | { readonly kind: 'refreshing'; readonly data: readonly T[]; readonly requestId: number }
  | { readonly kind: 'success'; readonly data: readonly T[] }
  | { readonly kind: 'empty'; readonly data: readonly [] }
  | { readonly kind: 'error'; readonly data: readonly T[]; readonly error: ApiError }

export interface ResourceQuery<TItem, TParams, TPage> {
  readonly state: Readonly<ShallowRef<ResourceState<TItem>>>
  execute(params: TParams): Promise<TPage>
  refresh(): Promise<TPage>
  retry(): Promise<TPage>
  reset(): void
  dispose(): void
}

export interface ResourceRequestContext {
  readonly signal: AbortSignal
}

export interface ResourceQueryOptions<TItem, TParams, TPage> {
  readonly request: (params: TParams, context: ResourceRequestContext) => Promise<TPage>
  readonly selectItems: (page: TPage) => readonly TItem[]
  readonly onCommit?: (page: TPage, params: TParams) => TParams | void
}
