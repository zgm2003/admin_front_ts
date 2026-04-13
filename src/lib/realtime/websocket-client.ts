import Cookies from 'js-cookie'
import { emitWsMessage, type WsMessage } from './message-bus'

export interface WebSocketSnapshot {
  ws: WebSocket | null
  isConnected: boolean
  isBound: boolean
  clientId: string
  reconnectCount: number
}

export interface WebSocketClientConsumer {
  autoConnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onMessage?: (message: WsMessage) => void
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (error: Event) => void
  onStateChange?: (snapshot: WebSocketSnapshot) => void
}

let sharedWs: WebSocket | null = null
let sharedIsConnected = false
let sharedIsBound = false
let sharedClientId = ''
let sharedReconnectCount = 0
let sharedReconnectTimer: ReturnType<typeof setTimeout> | null = null

const consumers = new Set<WebSocketClientConsumer>()

function getWebSocketUrl() {
  return import.meta.env.VITE_WEB_SOCKET_URL || 'ws://127.0.0.1:7272'
}

export function extractClientId(message: WsMessage<{ client_id?: string }>) {
  return typeof message.data.client_id === 'string' ? message.data.client_id : ''
}

export function shouldReconnect(params: {
  reconnectCount: number
  maxReconnectAttempts: number
  consumerCount: number
}) {
  const { reconnectCount, maxReconnectAttempts, consumerCount } = params
  return reconnectCount < maxReconnectAttempts && consumerCount > 0
}

function getReconnectOptions() {
  const maxReconnectAttempts = Math.max(...Array.from(consumers).map((consumer) => consumer.maxReconnectAttempts ?? 10), 10)
  const reconnectInterval = Math.min(...Array.from(consumers).map((consumer) => consumer.reconnectInterval ?? 3000), 3000)

  return {
    maxReconnectAttempts,
    reconnectInterval,
  }
}

function getSnapshot(): WebSocketSnapshot {
  return {
    ws: sharedWs,
    isConnected: sharedIsConnected,
    isBound: sharedIsBound,
    clientId: sharedClientId,
    reconnectCount: sharedReconnectCount,
  }
}

function notifyStateChange() {
  const snapshot = getSnapshot()
  consumers.forEach((consumer) => consumer.onStateChange?.(snapshot))
}

function notifyConnected() {
  consumers.forEach((consumer) => consumer.onConnected?.())
}

function notifyDisconnected() {
  consumers.forEach((consumer) => consumer.onDisconnected?.())
}

function notifyError(error: Event) {
  consumers.forEach((consumer) => consumer.onError?.(error))
}

function notifyMessage(message: WsMessage) {
  consumers.forEach((consumer) => consumer.onMessage?.(message))
}

function clearReconnectTimer() {
  if (sharedReconnectTimer) {
    clearTimeout(sharedReconnectTimer)
    sharedReconnectTimer = null
  }
}

export async function bindSharedWebSocketUser() {
  const token = Cookies.get('access_token')
  if (!token || !sharedIsConnected || sharedIsBound || !sharedClientId) {
    return
  }

  try {
    const { default: request } = await import('@/lib/http')
    await request.post('/api/admin/WebSocket/bind', { client_id: sharedClientId })
  } catch (error) {
    console.error('[WebSocket] Bind failed:', error)
  }
}

export function sendSharedWebSocket(type: string, data: Record<string, unknown> = {}) {
  if (sharedWs?.readyState !== WebSocket.OPEN) {
    return
  }

  if (type === 'pong') {
    sharedWs.send(JSON.stringify({ type: 'pong' }))
    return
  }

  sharedWs.send(JSON.stringify({ type, data }))
}

function handleSharedMessage(message: WsMessage<{ client_id?: string; message?: string }>) {
  switch (message.type) {
    case 'init':
      sharedClientId = extractClientId(message)
      void bindSharedWebSocketUser()
      notifyStateChange()
      break
    case 'bind_success':
      sharedIsBound = true
      notifyStateChange()
      break
    case 'ping':
      sendSharedWebSocket('pong')
      break
    case 'error':
      console.warn('[WebSocket] Server error:', message.data?.message)
      break
  }
}

export function connectSharedWebSocket() {
  if (sharedWs?.readyState === WebSocket.OPEN) {
    return
  }

  try {
    sharedWs = new WebSocket(getWebSocketUrl())

    sharedWs.onopen = () => {
      sharedIsConnected = true
      sharedReconnectCount = 0
      notifyStateChange()
      notifyConnected()
    }

    sharedWs.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WsMessage<{ client_id?: string; message?: string }>
        handleSharedMessage(message)
        emitWsMessage(message)
        notifyMessage(message)
      } catch (error) {
        console.error('[WebSocket] Parse message error:', error)
      }
    }

    sharedWs.onclose = () => {
      sharedIsConnected = false
      sharedIsBound = false
      notifyStateChange()
      notifyDisconnected()

      const { maxReconnectAttempts, reconnectInterval } = getReconnectOptions()
      if (shouldReconnect({
        reconnectCount: sharedReconnectCount,
        maxReconnectAttempts,
        consumerCount: consumers.size,
      })) {
        sharedReconnectTimer = setTimeout(() => {
          sharedReconnectCount++
          notifyStateChange()
          connectSharedWebSocket()
        }, reconnectInterval)
      }
    }

    sharedWs.onerror = (error) => {
      console.error('[WebSocket] Error:', error)
      notifyError(error)
    }
  } catch (error) {
    console.error('[WebSocket] Connect error:', error)
  }
}

export function disconnectSharedWebSocket() {
  clearReconnectTimer()
  if (sharedWs) {
    sharedWs.close()
    sharedWs = null
  }
  sharedIsConnected = false
  sharedIsBound = false
  notifyStateChange()
}

export function retainWebSocketConsumer(consumer: WebSocketClientConsumer) {
  consumers.add(consumer)
  consumer.onStateChange?.(getSnapshot())

  if (consumer.autoConnect !== false && !sharedWs) {
    connectSharedWebSocket()
  }

  return {
    release() {
      consumers.delete(consumer)
      if (consumers.size === 0) {
        disconnectSharedWebSocket()
      }
    },
    connect: connectSharedWebSocket,
    disconnect: disconnectSharedWebSocket,
    send: sendSharedWebSocket,
    bindUser: bindSharedWebSocketUser,
    getSnapshot,
  }
}
