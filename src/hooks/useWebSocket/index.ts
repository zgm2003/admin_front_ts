import { ref, onMounted, onUnmounted } from 'vue'
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

/**
 * WebSocket Hook
 * 
 * 功能：
 * - 自动连接和重连
 * - 心跳保活
 * - Token 绑定
 * - 消息分发
 * 
 * @example
 * ```ts
 * const { isConnected, send } = useWebSocket({
 *   onMessage: (msg) => console.log(msg)
 * })
 * 
 * // 监听特定类型消息
 * onWsMessage('notification', (msg) => {
 *   ElNotification.info({ title: msg.data.title, message: msg.data.content })
 * })
 * ```
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

  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const isBound = ref(false)
  const reconnectCount = ref(0)
  const clientId = ref('')

  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  const wsUrl = import.meta.env.VITE_WEB_SOCKET_URL || 'ws://127.0.0.1:7272'

  /** 连接 WebSocket */
  function connect() {
    if (ws.value?.readyState === WebSocket.OPEN) return

    try {
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        console.log('[WebSocket] 连接成功')
        isConnected.value = true
        reconnectCount.value = 0
        onConnected?.()
      }

      ws.value.onmessage = (event) => {
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

      ws.value.onclose = () => {
        isConnected.value = false
        isBound.value = false
        onDisconnected?.()
        
        // 自动重连
        if (reconnectCount.value < maxReconnectAttempts) {
          reconnectTimer = setTimeout(() => {
            reconnectCount.value++
            connect()
          }, reconnectInterval)
        }
      }

      ws.value.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        onError?.(error)
      }
    } catch (e) {
      console.error('[WebSocket] Connect error:', e)
    }
  }

  /** 断开连接 */
  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    isConnected.value = false
    isBound.value = false
  }

  /** 发送消息 */
  function send(type: string, data: any = {}) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      // 简单消息直接发送 type，复杂消息发送 JSON
      if (type === 'pong') {
        ws.value.send(JSON.stringify({ type: 'pong' }))
      } else {
        ws.value.send(JSON.stringify({ type, data }))
      }
    }
  }

  /** 绑定用户（通过 HTTP 接口） */
  async function bindUser() {
    const token = Cookies.get('access_token')
    if (!token || !isConnected.value || isBound.value || !clientId.value) return

    try {
      await request.post('/api/admin/WebSocket/bind', { client_id: clientId.value })
      // bind_success 会通过 WebSocket 消息返回
    } catch (e) {
      console.error('[WebSocket] Bind failed:', e)
    }
  }

  /** 内部消息处理 */
  function handleMessage(message: WsMessage) {
    switch (message.type) {
      case 'init':
        // 后端返回格式: { type: 'init', client_id: 'xxx' }
        clientId.value = (message as any).client_id || message.data?.client_id
        console.log('[WebSocket] 收到 client_id:', clientId.value)
        // 收到 init 后通过 HTTP 接口绑定用户
        bindUser()
        break
      case 'bind_success':
        console.log('[WebSocket] 绑定成功，用户已上线')
        isBound.value = true
        break
      case 'ping':
        // 服务器发来的心跳，响应 pong
        send('pong')
        break
      case 'error':
        console.warn('[WebSocket] Server error:', message.data?.message)
        break
    }
  }

  onMounted(() => {
    if (autoConnect) {
      connect()
    }
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    ws,
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
