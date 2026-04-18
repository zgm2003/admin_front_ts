import { computed, ref, onMounted, onUnmounted } from 'vue'
import {
  bindSharedWebSocketUser,
  connectSharedWebSocket,
  disconnectSharedWebSocket,
  retainWebSocketConsumer,
  sendSharedWebSocket,
} from '@/lib/realtime/websocket-client'
import {
  type WsMessage,
} from '@/lib/realtime/message-bus'

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

/**
 * WebSocket Hook（单例模式）
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    onMessage,
    onConnected,
    onDisconnected,
    onError,
  } = options

  const isConnected = ref(false)
  const isBound = ref(false)
  const clientId = ref('')
  const reconnectCount = ref(0)
  let consumerHandle: ReturnType<typeof retainWebSocketConsumer> | null = null

  onMounted(() => {
    consumerHandle = retainWebSocketConsumer({
      ...options,
      autoConnect,
      onMessage,
      onConnected,
      onDisconnected,
      onError,
      onStateChange(snapshot) {
        isConnected.value = snapshot.isConnected
        isBound.value = snapshot.isBound
        clientId.value = snapshot.clientId
        reconnectCount.value = snapshot.reconnectCount
      },
    })
  })

  onUnmounted(() => {
    consumerHandle?.release()
    consumerHandle = null
  })

  return {
    ws: computed(() => consumerHandle?.getSnapshot().ws ?? null),
    isConnected,
    isBound,
    clientId,
    reconnectCount,
    connect: connectSharedWebSocket,
    disconnect: disconnectSharedWebSocket,
    send: sendSharedWebSocket,
    bindUser: bindSharedWebSocketUser,
  }
}

export default useWebSocket
