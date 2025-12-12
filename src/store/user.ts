import { defineStore } from 'pinia'
import { UsersApi } from '@/api/user/users'

export const useUserStore = defineStore('user', {
  state: () => ({
    user_id: '',
    avatar: '',
    username: '',
    permissions: [] as any[],
    router: [] as any[],
    buttons: [] as any[],
    loading: false,
  }),
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
        this.buttons = data.buttons
      } finally {
        this.loading = false
      }
    },
    can(code: string) {
      return this.buttons.some((btn: any) => btn.code === code)
    },
  },
})
