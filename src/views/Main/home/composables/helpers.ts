import type { DynamicRouteItem, PermissionMenuItem, QuickEntryItem } from '@/types/user'

export const HOME_QUICK_ENTRY_LIMIT = 6

export interface HomeOverviewSignal {
  key: 'notifications' | 'quickEntry' | 'wallet' | 'user'
  value: string
  tone: 'danger' | 'primary' | 'success' | 'warning'
}

export interface HomeQuickEntryOption {
  permissionId: number
  label: string
  path: string
  icon: string
}

export interface HomeQuickEntryDraftItem extends HomeQuickEntryOption {
  id: number | null
}

export interface HomeNavigationAction {
  type: 'none' | 'internal' | 'external'
  value?: string
}

export function isQuickEntryLimitReached(count: number, limit = HOME_QUICK_ENTRY_LIMIT) {
  return count >= limit
}

export function resolveHomeNavigationAction(target?: string): HomeNavigationAction {
  const value = target?.trim() || ''
  if (!value) {
    return { type: 'none' }
  }

  if (/^https?:\/\//i.test(value)) {
    return {
      type: 'external',
      value,
    }
  }

  return {
    type: 'internal',
    value,
  }
}

export interface AddressTreeNode {
  label?: string
  value?: number
  children?: AddressTreeNode[]
}

export function buildAddressLabel(tree: AddressTreeNode[], value: number): string {
  return resolveAddressPath(tree, value).join(' / ')
}

function resolveAddressPath(tree: AddressTreeNode[], value: number): string[] {
  for (const item of tree) {
    if (item.value === value) {
      return item.label ? [item.label] : []
    }

    if (item.children?.length) {
      const childPath = resolveAddressPath(item.children, value)
      if (childPath.length > 0) {
        return item.label ? [item.label, ...childPath] : childPath
      }
    }
  }

  return []
}

export function buildHomeOverviewSignals(params: {
  userId: number
  unreadCount: number
  quickEntryCount: number
}): HomeOverviewSignal[] {
  const { userId, unreadCount, quickEntryCount } = params

  return [
    {
      key: 'notifications',
      value: String(unreadCount),
      tone: unreadCount > 0 ? 'danger' : 'primary',
    },
    {
      key: 'quickEntry',
      value: String(quickEntryCount),
      tone: 'primary',
    },
    {
      key: 'wallet',
      value: 'ready',
      tone: 'success',
    },
    {
      key: 'user',
      value: userId > 0 ? `#${userId}` : '--',
      tone: 'warning',
    },
  ]
}

function normalizePermissionOption(params: {
  permissionId: number
  permissionMap: Map<string, PermissionMenuItem>
}): HomeQuickEntryOption | null {
  const menu = params.permissionMap.get(String(params.permissionId))
  if (!menu?.path) {
    return null
  }

  return {
    permissionId: params.permissionId,
    label: menu.label,
    path: menu.path,
    icon: menu.icon || 'Document',
  }
}

export function buildQuickEntryManagerOptions(params: {
  routes: DynamicRouteItem[]
  permissionMap: Map<string, PermissionMenuItem>
  selectedPermissionIds: Set<number>
}): HomeQuickEntryOption[] {
  const { routes, permissionMap, selectedPermissionIds } = params

  return routes
    .map((route) => {
      const menuId = Number(route.meta?.menuId)
      if (!Number.isFinite(menuId) || menuId <= 0 || selectedPermissionIds.has(menuId)) {
        return null
      }

      return normalizePermissionOption({ permissionId: menuId, permissionMap })
    })
    .filter((item): item is HomeQuickEntryOption => item !== null)
}

export function buildQuickEntryDraft(params: {
  quickEntries: QuickEntryItem[]
  routes: DynamicRouteItem[]
  permissionMap: Map<string, PermissionMenuItem>
}): HomeQuickEntryDraftItem[] {
  const routePermissionIds = new Set(
    params.routes
      .map((route) => Number(route.meta?.menuId))
      .filter((menuId) => Number.isFinite(menuId) && menuId > 0),
  )

  const draft: HomeQuickEntryDraftItem[] = []

  params.quickEntries.forEach((entry) => {
    if (!routePermissionIds.has(entry.permission_id)) {
      return
    }

    const option = normalizePermissionOption({
      permissionId: entry.permission_id,
      permissionMap: params.permissionMap,
    })

    if (!option) {
      return
    }

    draft.push({
      ...option,
      id: entry.id,
    })
  })

  return draft
}

export function moveQuickEntryDraftItem(
  draft: HomeQuickEntryDraftItem[],
  index: number,
  delta: -1 | 1,
): HomeQuickEntryDraftItem[] {
  const nextIndex = index + delta
  if (index < 0 || nextIndex < 0 || index >= draft.length || nextIndex >= draft.length) {
    return [...draft]
  }

  const next = [...draft]
  const current = next[index]
  next[index] = next[nextIndex]!
  next[nextIndex] = current!
  return next
}
