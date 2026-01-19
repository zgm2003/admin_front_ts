import { defineStore } from 'pinia'
import { UsersApi } from '@/api/user/users'

export const useUserStore = defineStore('user', {
  state: () => ({
    user_id: '',
    avatar: '',
    username: '',
    role_name: '',
    permissions: [] as any[],
    router: [] as any[],
    buttonCodes: [] as string[],
    _permissionMapCache: null as Map<string, any> | null,
  }),
  getters: {
    permissionMap: (state) => {
      if (state._permissionMapCache) return state._permissionMapCache
      
      const map = new Map<string, any>()
      const traverse = (items: any[]) => {
        items.forEach(item => {
          map.set(String(item.index), item)
          if (item.children && item.children.length > 0) {
            traverse(item.children)
          }
        })
      }
      traverse(state.permissions)
      state._permissionMapCache = map
      return map
    }
  },
  actions: {
    async fetchUserInfo() {
      try {
        const data = await UsersApi.init()
        this.user_id = data.user_id
        this.avatar = data.avatar
        this.username = data.username || '未设置用户名'
        this.role_name = data.role_name || ''
        data.permissions.unshift({ icon: 'HomeFilled', index: '0', label: '首页', path: '/home', i18n_key: 'menu.home' })
        this.permissions = data.permissions
        this.router = data.router
        this.buttonCodes = data.buttonCodes || []
        this._permissionMapCache = null
      } catch (e) {
        this.user_id = ''
        this.permissions = []
        this.router = []
        this.buttonCodes = []
        this._permissionMapCache = null
        throw e
      }
    },
    can(code: string) {
      return this.buttonCodes.includes(code)
    },
  },
})
