import type { PermissionTreeNode } from '@/api/permission/permission'

export function buildLeafSelectablePermissionTree(nodes: PermissionTreeNode[]): PermissionTreeNode[] {
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
