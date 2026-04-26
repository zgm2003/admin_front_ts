import { PermissionTypeEnum } from '@/enums'
import type { PermissionTreeNode } from '@/api/permission/permission'

export interface RoleMatrixAction {
  id: number
  code: string
  label: string
}

export interface RoleMatrixRow {
  pageId: number
  pageLabel: string
  pagePermissionId: number | null
  platform: string
  actions: RoleMatrixAction[]
}

export interface RoleMatrixGroup {
  groupId: number | string
  groupLabel: string
  platform: string
  rows: RoleMatrixRow[]
}

export interface RoleMatrixSelectionState {
  total: number
  selected: number
  checked: boolean
  indeterminate: boolean
}

interface RoleMatrixBuildOptions {
  rootPagesLabel?: string
  rootButtonsLabel?: string
}

const ROOT_PAGES_GROUP_ID = '__root_pages__'
const ROOT_BUTTONS_GROUP_ID = '__root_buttons__'

function createPageRow(item: PermissionTreeNode): RoleMatrixRow {
  return {
    pageId: item.value,
    pageLabel: item.label,
    pagePermissionId: item.value,
    platform: item.platform,
    actions: (item.children ?? [])
      .filter((child) => child.type === PermissionTypeEnum.BUTTON)
      .map((child) => ({ id: child.value, code: String(child.code ?? ''), label: child.label })),
  }
}

function createStandaloneButtonRow(item: PermissionTreeNode): RoleMatrixRow {
  return {
    pageId: item.value,
    pageLabel: item.label,
    pagePermissionId: null,
    platform: item.platform,
    actions: [{ id: item.value, code: String(item.code ?? ''), label: item.label }],
  }
}

export function buildRolePermissionMatrix(
  nodes: PermissionTreeNode[],
  platform: string,
  options: RoleMatrixBuildOptions = {},
): RoleMatrixGroup[] {
  const groups: RoleMatrixGroup[] = []
  const rootPagesLabel = options.rootPagesLabel ?? 'Ungrouped Pages'
  const rootButtonsLabel = options.rootButtonsLabel ?? 'Root Buttons'

  const ensureSyntheticGroup = (groupId: string, groupLabel: string): RoleMatrixGroup => {
    const existing = groups.find((group) => group.groupId === groupId)
    if (existing) {
      return existing
    }

    const group = { groupId, groupLabel, platform, rows: [] }
    groups.push(group)
    return group
  }

  const walk = (items: PermissionTreeNode[], currentGroup: RoleMatrixGroup | null = null, parentType = 0) => {
    for (const item of items) {
      if (item.platform !== platform) {
        continue
      }

      if (item.type === PermissionTypeEnum.DIR) {
        const group = currentGroup ?? {
          groupId: item.value,
          groupLabel: item.label,
          platform: item.platform,
          rows: [],
        }
        if (!currentGroup) {
          groups.push(group)
        }
        if (item.children?.length) {
          walk(item.children, group, item.type)
        }
        continue
      }

      if (item.type === PermissionTypeEnum.PAGE) {
        const group = currentGroup ?? ensureSyntheticGroup(ROOT_PAGES_GROUP_ID, rootPagesLabel)
        group.rows.push(createPageRow(item))
        continue
      }

      if (item.type === PermissionTypeEnum.BUTTON && parentType !== PermissionTypeEnum.PAGE) {
        const group = currentGroup ?? ensureSyntheticGroup(ROOT_BUTTONS_GROUP_ID, rootButtonsLabel)
        group.rows.push(createStandaloneButtonRow(item))
      }
    }
  }

  walk(nodes)

  return groups.filter((group) => group.rows.length > 0)
}

export function toggleMatrixAction(selectedIds: number[], permissionId: number, checked: boolean): number[] {
  const set = new Set(selectedIds)

  if (checked) {
    set.add(permissionId)
  } else {
    set.delete(permissionId)
  }

  return Array.from(set).sort((a, b) => a - b)
}

export function getRoleMatrixRowPermissionIds(row: RoleMatrixRow): number[] {
  return [
    ...(row.pagePermissionId ? [row.pagePermissionId] : []),
    ...row.actions.map((action) => action.id),
  ]
}

export function getRoleMatrixGroupPermissionIds(group: RoleMatrixGroup): number[] {
  return group.rows.flatMap(getRoleMatrixRowPermissionIds)
}

export function getRoleMatrixSelectionState(
  permissionIds: number[],
  selectedIds: readonly number[] | ReadonlySet<number>,
): RoleMatrixSelectionState {
  const selectedSet = selectedIds instanceof Set ? selectedIds : new Set(selectedIds)
  const selected = permissionIds.reduce((count, permissionId) => (
    selectedSet.has(permissionId) ? count + 1 : count
  ), 0)

  return {
    total: permissionIds.length,
    selected,
    checked: permissionIds.length > 0 && selected === permissionIds.length,
    indeterminate: selected > 0 && selected < permissionIds.length,
  }
}

export function getRoleMatrixRowSelectionState(
  row: RoleMatrixRow,
  selectedIds: readonly number[] | ReadonlySet<number>,
): RoleMatrixSelectionState {
  return getRoleMatrixSelectionState(getRoleMatrixRowPermissionIds(row), selectedIds)
}

export function getRoleMatrixGroupSelectionState(
  group: RoleMatrixGroup,
  selectedIds: readonly number[] | ReadonlySet<number>,
): RoleMatrixSelectionState {
  return getRoleMatrixSelectionState(getRoleMatrixGroupPermissionIds(group), selectedIds)
}

export function toggleMatrixGroup(selectedIds: number[], group: RoleMatrixGroup, checked: boolean): number[] {
  const set = new Set(selectedIds)
  const permissionIds = getRoleMatrixGroupPermissionIds(group)

  for (const permissionId of permissionIds) {
    if (checked) {
      set.add(permissionId)
    } else {
      set.delete(permissionId)
    }
  }

  return Array.from(set).sort((a, b) => a - b)
}

export function toggleMatrixPage(selectedIds: number[], row: RoleMatrixRow, checked: boolean): number[] {
  if (!row.pagePermissionId) {
    return selectedIds
  }

  const set = new Set(selectedIds)
  if (checked) {
    set.add(row.pagePermissionId)
  } else {
    for (const permissionId of getRoleMatrixRowPermissionIds(row)) {
      set.delete(permissionId)
    }
  }

  return Array.from(set).sort((a, b) => a - b)
}

export function toggleMatrixRowAction(
  selectedIds: number[],
  row: RoleMatrixRow,
  permissionId: number,
  checked: boolean,
): number[] {
  const set = new Set(selectedIds)

  if (checked) {
    if (row.pagePermissionId) {
      set.add(row.pagePermissionId)
    }
    set.add(permissionId)
  } else {
    set.delete(permissionId)
  }

  return Array.from(set).sort((a, b) => a - b)
}

export function diffPermissionIds(before: number[], after: number[]): { added: number[]; removed: number[] } {
  const beforeSet = new Set(before)
  const afterSet = new Set(after)

  return {
    added: after.filter((id) => !beforeSet.has(id)).sort((a, b) => a - b),
    removed: before.filter((id) => !afterSet.has(id)).sort((a, b) => a - b),
  }
}
