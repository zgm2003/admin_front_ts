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

export function buildRolePermissionMatrix(nodes: PermissionTreeNode[], platform: string): RoleMatrixRow[] {
  const rows: RoleMatrixRow[] = []

  const walk = (items: PermissionTreeNode[], parentType = 0) => {
    for (const item of items) {
      if (item.platform !== platform) {
        continue
      }

      if (item.type === PermissionTypeEnum.BUTTON && parentType !== PermissionTypeEnum.PAGE) {
        rows.push({
          pageId: item.value,
          pageLabel: item.label,
          pagePermissionId: null,
          platform: item.platform,
          actions: [{ id: item.value, code: String(item.code ?? ''), label: item.label }],
        })
      }

      if (item.type === PermissionTypeEnum.PAGE) {
        rows.push({
          pageId: item.value,
          pageLabel: item.label,
          pagePermissionId: item.value,
          platform: item.platform,
          actions: (item.children ?? [])
            .filter((child) => child.type === PermissionTypeEnum.BUTTON)
            .map((child) => ({ id: child.value, code: String(child.code ?? ''), label: child.label })),
        })
      }

      if (item.children?.length) {
        walk(item.children, item.type)
      }
    }
  }

  walk(nodes)

  return rows
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
