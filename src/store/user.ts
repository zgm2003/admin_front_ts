import { defineStore } from 'pinia'
import type { PrincipalSnapshot } from '@/app/state'
import type { PrincipalMenuItem } from '@/modules/http/schema'
import type { RuntimeRoute } from '@/modules/routing/contracts'
import type { PermissionCode } from '@/modules/routing/generated/permissions'
import { HOME_MENU_ITEM } from './menu'
import type { PermissionMenuItem } from '@/types/user'

interface UserState {
  user_id: number | ''
  avatar: string
  username: string
  role_name: string
  permissions: PermissionMenuItem[]
  routes: RuntimeRoute[]
  buttonCodes: Set<PermissionCode>
  _permissionMapCache: Map<string, PermissionMenuItem> | null
}

function mutableMenu(item: PrincipalMenuItem): PermissionMenuItem {
  return {
    index: item.index,
    label: item.label,
    path: item.path,
    icon: item.icon,
    i18n_key: item.i18n_key,
    show_menu: item.show_menu,
    sort: item.sort,
    parent_id: item.parent_id,
    children: item.children.map(mutableMenu),
  }
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user_id: '',
    avatar: '',
    username: '',
    role_name: '',
    permissions: [],
    routes: [],
    buttonCodes: new Set<PermissionCode>(),
    _permissionMapCache: null,
  }),
  getters: {
    permissionMap: (state): Map<string, PermissionMenuItem> => {
      if (state._permissionMapCache) {
        return state._permissionMapCache
      }

      const map = new Map<string, PermissionMenuItem>()
      const traverse = (items: PermissionMenuItem[]) => {
        items.forEach((item) => {
          map.set(String(item.index), item)
          if (item.children.length > 0) {
            traverse(item.children)
          }
        })
      }

      traverse(state.permissions)
      state._permissionMapCache = map
      return map
    },
  },
  actions: {
    applyPrincipal(principal: PrincipalSnapshot) {
      this.user_id = principal.userId
      this.avatar = principal.avatar
      this.username = principal.username
      this.role_name = principal.roleName
      this.permissions = [HOME_MENU_ITEM, ...principal.menus.map(mutableMenu)]
      this.routes = [...principal.routes]
      this.buttonCodes = new Set(principal.buttonCodes)
      this._permissionMapCache = null
    },
    clearPrincipal() {
      this.user_id = ''
      this.avatar = ''
      this.username = ''
      this.role_name = ''
      this.permissions = []
      this.routes = []
      this.buttonCodes = new Set<PermissionCode>()
      this._permissionMapCache = null
    },
    can(code: PermissionCode) {
      return this.buttonCodes.has(code)
    },
  },
})
