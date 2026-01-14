import { defineStore } from 'pinia'
import { UsersApi } from '@/api/user/users'

export const useUserStore = defineStore('user', {
  state: () => ({
    user_id: '',
    avatar: '',
    username: '',
    permissions: [] as any[],
    router: [] as any[],
    buttonCodes: [] as string[],
    loading: false,
  }),
  getters: {
    permissionMap: (state) => {
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
      return map
    }
  },
  actions: {
    async fetchUserInfo() {
      this.loading = true
      try {
        const data = await UsersApi.init()
        this.user_id = data.user_id
        this.avatar = data.avatar
        this.username = data.username || '未设置用户名'
        data.permissions.unshift({ icon: 'HomeFilled', index: '0', label: '首页', path: '/home', i18n_key: 'menu.home' })
        this.permissions = data.permissions
        this.router = data.router
        this.buttonCodes = data.buttonCodes || []
      } catch (e) {
        // 清空状态，让调用方知道失败了
        this.user_id = ''
        this.permissions = []
        this.router = []
        this.buttonCodes = []
        throw e  // 向上抛出，让 setupDynamicRoutes 捕获
      } finally {
        this.loading = false
      }
    },
    can(code: string) {
      return this.buttonCodes.includes(code)
    },
  },
})
