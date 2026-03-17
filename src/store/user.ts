import { defineStore } from 'pinia'
import { UsersApi } from '@/api/user/users'
import { HOME_MENU_ITEM } from './menu'
import type { DynamicRouteItem, PermissionMenuItem, QuickEntryItem } from '@/types/user'

interface UserState {
  user_id: number | ''
  avatar: string
  username: string
  role_name: string
  permissions: PermissionMenuItem[]
  router: DynamicRouteItem[]
  buttonCodes: string[]
  quickEntry: QuickEntryItem[]
  _permissionMapCache: Map<string, PermissionMenuItem> | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user_id: '',
    avatar: '',
    username: '',
    role_name: '',
    permissions: [],
    router: [],
    buttonCodes: [],
    quickEntry: [],
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
          if (item.children?.length) {
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
    async fetchUserInfo() {
      try {
        const data = await UsersApi.init()
        this.user_id = data.user_id
        this.avatar = data.avatar
        this.username = data.username || '未设置用户名'
        this.role_name = data.role_name || ''
        this.permissions = [HOME_MENU_ITEM, ...(data.permissions || [])]
        this.router = data.router || []
        this.buttonCodes = data.buttonCodes || []
        this.quickEntry = data.quick_entry || []
        this._permissionMapCache = null
      } catch (error) {
        this.user_id = ''
        this.permissions = []
        this.router = []
        this.buttonCodes = []
        this.quickEntry = []
        this._permissionMapCache = null
        throw error
      }
    },
    can(code: string) {
      return this.buttonCodes.includes(code)
    },
  },
})
