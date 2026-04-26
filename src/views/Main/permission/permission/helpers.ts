import { PermissionTypeEnum, PlatformEnum } from '@/enums'
import type { PermissionTreeNode } from '@/api/permission/permission'

interface ParentRuleInput {
  platform: string
  type: number
}

export function isPermissionParentSelectable(
  node: Pick<PermissionTreeNode, 'platform' | 'type'>,
  input: ParentRuleInput,
): boolean {
  if (node.platform !== input.platform) {
    return false
  }

  if (input.type === PermissionTypeEnum.DIR) {
    return node.type === PermissionTypeEnum.DIR
  }

  if (input.type === PermissionTypeEnum.PAGE) {
    return node.type === PermissionTypeEnum.DIR
  }

  if (input.type === PermissionTypeEnum.BUTTON) {
    return node.type === PermissionTypeEnum.PAGE
  }

  return false
}

export function normalizePermissionParentId(parentId: number | '', input: ParentRuleInput): number {
  if (parentId !== '') {
    return Number(parentId)
  }

  if (input.type === PermissionTypeEnum.BUTTON && input.platform === PlatformEnum.ADMIN) {
    throw new Error('admin button requires a page parent')
  }

  return 0
}

export function buildPermissionSuggestion(input:
  | { type: typeof PermissionTypeEnum.PAGE; viewKey: string }
  | { type: typeof PermissionTypeEnum.BUTTON; domain: string; entity: string; action: string },
) {
  if (input.type === PermissionTypeEnum.PAGE) {
    const viewKey = input.viewKey.replace(/^\/+/, '')

    return {
      path: `/${viewKey}`,
      component: viewKey,
      i18n_key: `menu.${viewKey.replace(/\//g, '_')}`,
    }
  }

  return { code: `${input.domain}_${input.entity}_${input.action}` }
}

export function applyParentSelectableState(nodes: PermissionTreeNode[], input: ParentRuleInput): PermissionTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    disabled: !isPermissionParentSelectable(node, input),
    children: node.children?.length ? applyParentSelectableState(node.children, input) : undefined,
  }))
}
