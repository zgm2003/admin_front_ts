import {
  localViewKeys,
  localViewLoaders,
  type LocalViewKey,
  type LocalViewLoader,
} from '@/modules/routing/generated/local-views'

const localViewKeySet: ReadonlySet<string> = new Set(localViewKeys)

export function isLocalViewKey(value: string): value is LocalViewKey {
  return localViewKeySet.has(value)
}

export function resolveViewComponent(viewKey: string): LocalViewLoader | undefined {
  return isLocalViewKey(viewKey) ? localViewLoaders[viewKey] : undefined
}

export { localViewKeys, localViewLoaders }
export type { LocalViewKey, LocalViewLoader }
