import { defineStore } from 'pinia'
import { ElNotification } from 'element-plus'
import Cookies from 'js-cookie'
import { useUserStore } from '@/store/user'
import { ChatApi } from '@/api/chat'

const userStore = useUserStore()
export const useChatStore = defineStore('chat', {
  state: () => ({
    socket: null as WebSocket | null,
    clientId: null as string | null,
    room_id: Cookies.get('room_id') || '1',
    onlineUsers: [] as any[],
    messageList: [] as any[],
    loading: false,
    page: { current_page: 1, page_size: 10, total: 0 },
    unreadMap: {} as Record<string, number>,
  }),
  actions: {
    async setRoomId(room_id: string) {
      this.room_id = room_id
      Cookies.set('room_id', room_id)
      this.resetMessages()
      await this.getMessageList()
      this.unreadMap[room_id] = 0
      try { await ChatApi.online({ room_id }) } catch {}
    },
    initSocket(url: string) {
      if (this.socket) return
      this.socket = new WebSocket(url)
      this.socket.onopen = () => { ElNotification({ title: 'WebSocket连接成功', type: 'success', duration: 2000 }) }
      this.socket.onmessage = async (event) => {
        const data = JSON.parse(event.data)
        switch (data.type) {
          case 'ping': this.socket!.send('pong'); break
          case 'init':
            this.clientId = data.client_id
            try { await ChatApi.init({ client_id: data.client_id }) } catch (err: any) { ElNotification.error({ message: err.message }) }
            break
          case 'online': {
            const arr = Object.values(data.data)
            this.onlineUsers = Object.values(Object.fromEntries((arr as any[]).map((user: any) => [user.id, user]))) as any[]
            break
          }
          case 'message': {
            const msg = { ...data.data, is_owner: data.data.user_id === userStore.user_id }
            if (data.data.room_id === this.room_id) this.messageList.push(msg)
            else this.unreadMap[data.data.room_id] = (this.unreadMap[data.data.room_id] || 0) + 1
            break
          }
          case 'logout': {
            this.onlineUsers = this.onlineUsers.filter((user: any) => user.client_id !== data.client_id)
            break
          }
        }
      }
      this.socket.onerror = () => { ElNotification({ title: 'WebSocket连接出错', type: 'error', duration: 2000 }) }
      this.socket.onclose = () => { ElNotification({ title: 'WebSocket连接关闭', type: 'warning', duration: 2000 }) }
    },
    async joinRoom(room_id: string) {
      if (!this.clientId) return
      await ChatApi.init({ client_id: this.clientId })
      this.setRoomId(room_id)
    },
    resetMessages() { this.messageList = []; this.page = { current_page: 1, page_size: 10, total: 0 } },
    async getMessageList() {
      this.loading = true
      try {
        const data: any = await ChatApi.list({ room_id: this.room_id, current_page: this.page.current_page, page_size: this.page.page_size })
        this.loading = false
        this.messageList = (data.list || []).reverse().map((item: any) => ({ ...item, is_owner: item.user_id === userStore.user_id }))
        this.page = data.page || this.page
      } catch { this.loading = false }
    },
    async loadMoreMessages() { this.page.page_size += 10; await this.getMessageList() },
    async exitRoom(room_id: string) {
      try { await ChatApi.exit({ room_id }); ElNotification({ title: '退出房间成功', type: 'success', duration: 2000 }) } catch (err: any) { ElNotification.error({ message: err.message }) }
    },
  },
})
