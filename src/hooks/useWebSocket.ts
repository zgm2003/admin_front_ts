import { computed, ref, onMounted, onUnmounted } from 'vue'
import Cookies from 'js-cookie'
import request from '@/utils/request'

export type MessageType = 'init' | 'pong' | 'bind_success' | 'error' | 'notification' | 'broadcast' | string

export interface WsMessage<T = any> {
  type: MessageType
  data: T
}

export interface UseWebSocketOptions {
  /** 是否自动连接，默认 true */
  autoConnect?: boolean
  /** 重连间隔（毫秒），默认 3000 */
  reconnectInterval?: number
  /** 最大重连次数，默认 10 */
  maxReconnectAttempts?: number
  /** 消息处理器 */
  onMessage?: (message: WsMessage) => void
  /** 连接成功回调 */
  onConnected?: () => void
  /** 断开连接回调 */
  onDisconnected?: () => void
  /** 错误回调 */
  onError?: (error: Event) => void
}

// 全局消息监听器
type MessageHandler = (message: WsMessage) => void
const globalHandlers = new Map<string, Set<MessageHandler>>()

// 单例 WebSocket 状态
let sharedWs: WebSocket | null = null
let sharedIsConnected = false
let sharedIsBound = false
let sharedClientId = ''
let sharedReconnectCount = 0
let sharedReconnectTimer: ReturnType<typeof setTimeout> | null = null
let instanceCount = 0

/**
 * WebSocket Hook（单例模式）
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    onMessage,
    onConnected,
    onDisconnected,
    onError,
  } = options

  const isConnected = ref(sharedIsConnected)
  const isBound = ref(sharedIsBound)
  const clientId = ref(sharedClientId)
  const reconnectCount = ref(sharedReconnectCount)

  const wsUrl = import.meta.env.VITE_WEB_SOCKET_URL || 'ws://127.0.0.1:7272'

  /** 连接 WebSocket */
  function connect() {
    if (sharedWs?.readyState === WebSocket.OPEN) return

    try {
      sharedWs = new WebSocket(wsUrl)

      sharedWs.onopen = () => {
        console.log('[WebSocket] 连接成功')
        sharedIsConnected = true
        isConnected.value = true
        sharedReconnectCount = 0
        reconnectCount.value = 0
        onConnected?.()
      }

      sharedWs.onmessage = (event) => {
        try {
          const message: WsMessage = JSON.parse(event.data)
          handleMessage(message)
          onMessage?.(message)
          
          // 分发给全局监听器
          const handlers = globalHandlers.get(message.type)
          handlers?.forEach(handler => handler(message))
        } catch (e) {
          console.error('[WebSocket] Parse message error:', e)
        }
      }

      sharedWs.onclose = () => {
        sharedIsConnected = false
        isConnected.value = false
        sharedIsBound = false
        isBound.value = false
        onDisconnected?.()
        
        // 自动重连
        if (sharedReconnectCount < maxReconnectAttempts && instanceCount > 0) {
          sharedReconnectTimer = setTimeout(() => {
            sharedReconnectCount++
            reconnectCount.value = sharedReconnectCount
            connect()
          }, reconnectInterval)
        }
      }

      sharedWs.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        onError?.(error)
      }
    } catch (e) {
      console.error('[WebSocket] Connect error:', e)
    }
  }

  /** 断开连接 */
  function disconnect() {
    if (sharedReconnectTimer) {
      clearTimeout(sharedReconnectTimer)
      sharedReconnectTimer = null
    }
    if (sharedWs) {
      sharedWs.close()
      sharedWs = null
    }
    sharedIsConnected = false
    isConnected.value = false
    sharedIsBound = false
    isBound.value = false
  }

  /** 发送消息 */
  function send(type: string, data: any = {}) {
    if (sharedWs?.readyState === WebSocket.OPEN) {
      if (type === 'pong') {
        sharedWs.send(JSON.stringify({ type: 'pong' }))
      } else {
        sharedWs.send(JSON.stringify({ type, data }))
      }
    }
  }

  /** 绑定用户 */
  async function bindUser() {
    const token = Cookies.get('access_token')
    if (!token || !sharedIsConnected || sharedIsBound || !sharedClientId) return

    try {
      await request.post('/api/admin/WebSocket/bind', { client_id: sharedClientId })
    } catch (e) {
      console.error('[WebSocket] Bind failed:', e)
    }
  }

  /** 内部消息处理 */
  function handleMessage(message: WsMessage) {
    switch (message.type) {
      case 'init':
        sharedClientId = (message as any).client_id || message.data?.client_id
        clientId.value = sharedClientId
        console.log('[WebSocket] 收到 client_id:', sharedClientId)
        bindUser()
        break
      case 'bind_success':
        console.log('[WebSocket] 绑定成功')
        sharedIsBound = true
        isBound.value = true
        break
      case 'ping':
        send('pong')
        break
      case 'error':
        console.warn('[WebSocket] Server error:', message.data?.message)
        break
    }
  }

  onMounted(() => {
    instanceCount++
    if (autoConnect && !sharedWs) {
      connect()
    }
    // 同步状态
    isConnected.value = sharedIsConnected
    isBound.value = sharedIsBound
    clientId.value = sharedClientId
  })

  onUnmounted(() => {
    instanceCount--
    // 最后一个实例卸载时断开连接
    if (instanceCount === 0) {
      disconnect()
    }
  })

  return {
    ws: computed(() => sharedWs),
    isConnected,
    isBound,
    clientId,
    reconnectCount,
    connect,
    disconnect,
    send,
    bindUser,
  }
}

/**
 * 注册全局消息监听器
 * @param type 消息类型
 * @param handler 处理函数
 * @returns 取消监听函数
 */
export function onWsMessage(type: string, handler: MessageHandler): () => void {
  if (!globalHandlers.has(type)) {
    globalHandlers.set(type, new Set())
  }
  globalHandlers.get(type)!.add(handler)

  return () => {
    globalHandlers.get(type)?.delete(handler)
  }
}

/**
 * 移除全局消息监听器
 */
export function offWsMessage(type: string, handler?: MessageHandler) {
  if (handler) {
    globalHandlers.get(type)?.delete(handler)
  } else {
    globalHandlers.delete(type)
  }
}

export default useWebSocket
