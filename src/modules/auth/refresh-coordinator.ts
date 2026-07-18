import type { RefreshCoordinator } from './types'

export const localRefreshCoordinator: RefreshCoordinator = {
  run(operation) {
    return operation()
  },
}
