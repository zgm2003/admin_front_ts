import type { PermissionTreeNode } from '@/api/permission/permission'

export interface SelectablePermissionTreeNode extends Omit<PermissionTreeNode, 'children'> {
  disabled: boolean
  children?: SelectablePermissionTreeNode[]
}

export function buildLeafSelectablePermissionTree(nodes: PermissionTreeNode[]): SelectablePermissionTreeNode[] {
  return nodes.map((node) => {
    const children = node.children?.length ? buildLeafSelectablePermissionTree(node.children) : undefined

    return {
      ...node,
      disabled: Boolean(children?.length),
      children,
    }
  })
}

export function collectLeafPermissionIds(nodes: PermissionTreeNode[]): number[] {
  const ids: number[] = []

  const walk = (items: PermissionTreeNode[]) => {
    for (const item of items) {
      if (item.children?.length) {
        walk(item.children)
        continue
      }

      ids.push(item.value)
    }
  }

  walk(nodes)

  return ids
}
