import { getCurrentScope, onScopeDispose } from 'vue'
import { createResourceQuery } from './query'
import type { ResourceQueryOptions } from './types'

export function useResourceQuery<TItem, TParams, TPage>(
  options: ResourceQueryOptions<TItem, TParams, TPage>,
) {
  const query = createResourceQuery(options)
  if (getCurrentScope()) onScopeDispose(() => query.dispose())
  return query
}
