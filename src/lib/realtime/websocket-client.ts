import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import { normalizeLoopbackURLHost } from '@/lib/network/loopback'
import { emitWsMessage, type WsMessage, type WsMessageData } from './message-bus'

const REALTIME_WS_PATH = `${ADMIN_API_PREFIX}/realtime/ws`
const TYPE_CONNECTED = 'realtime.connected.v1'
const TYPE_SUBSCRIBE = 'realtime.subscribe.v1'
const TYPE_ERROR = 'realtime.error.v1'

export interface WebSocketSnapshot {
  ws: WebSocket | null
  isConnected: boolean
  isReady: boolean
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
let sharedIsReady = false
let sharedReconnectCount = 0
let sharedReconnectTimer: ReturnType<typeof setTimeout> | null = null

const consumers = new Set<WebSocketClientConsumer>()

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function websocketProtocolFor(protocol: string) {
  return protocol === 'https:' ? 'wss:' : 'ws:'
}

export function buildWebSocketURL(params: {
  apiBaseURL?: string
  explicitURL?: string
  currentHostname?: string
}) {
  const explicitURL = params.explicitURL?.trim()
  if (explicitURL) {
    const wsURL = new URL(explicitURL)
    normalizeLoopbackURLHost(wsURL, params.currentHostname)
    return wsURL.toString()
  }

  const apiBaseURL = params.apiBaseURL?.trim()
  if (!apiBaseURL) {
    throw new Error('VITE_GO_API_BASE_URL is required to build realtime WebSocket URL')
  }

  const apiURL = new URL(apiBaseURL)
  normalizeLoopbackURLHost(apiURL, params.currentHostname)
  const wsURL = new URL(REALTIME_WS_PATH, apiURL.origin)
  wsURL.protocol = websocketProtocolFor(apiURL.protocol)
  return wsURL.toString()
}

function getWebSocketUrl() {
  return buildWebSocketURL({
    apiBaseURL: import.meta.env.VITE_GO_API_BASE_URL,
    explicitURL: import.meta.env.VITE_WEB_SOCKET_URL,
  })
}

export function buildIdentityTopics(data: WsMessageData) {
  const topics: string[] = []
  const userID = data.user_id
  if (typeof userID === 'number' && Number.isInteger(userID) && userID > 0) {
    topics.push(`user:${userID}`)
  }

  const platform = data.platform
  if (typeof platform === 'string' && platform.trim()) {
    topics.push(`platform:${platform.trim()}`)
  }

  return topics
}

export function createRealtimeRequestID(prefix = 'rt') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
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
    isReady: sharedIsReady,
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

function normalizeMessage(raw: unknown): WsMessage {
  if (!isRecord(raw) || typeof raw.type !== 'string') {
    throw new Error('Invalid realtime envelope: type is required')
  }

  return {
    type: raw.type,
    request_id: typeof raw.request_id === 'string' ? raw.request_id : undefined,
    data: isRecord(raw.data) ? raw.data : {},
  }
}

export function sendSharedWebSocket(type: string, data: WsMessageData = {}, requestID = createRealtimeRequestID()) {
  if (sharedWs?.readyState !== WebSocket.OPEN) {
    return null
  }

  sharedWs.send(JSON.stringify({
    type,
    request_id: requestID,
    data,
  }))
  return requestID
}

function subscribeIdentityTopics(data: WsMessageData) {
  const topics = buildIdentityTopics(data)
  if (topics.length === 0) {
    return
  }

  sendSharedWebSocket(TYPE_SUBSCRIBE, { topics }, createRealtimeRequestID('subscribe'))
}

function handleSharedMessage(message: WsMessage) {
  switch (message.type) {
    case TYPE_CONNECTED:
      sharedIsReady = true
      notifyStateChange()
      subscribeIdentityTopics(message.data)
      break
    case TYPE_ERROR:
      console.warn('[WebSocket] Server error:', message.data)
      break
  }
}

export function connectSharedWebSocket() {
  if (sharedWs?.readyState === WebSocket.OPEN || sharedWs?.readyState === WebSocket.CONNECTING) {
    return
  }

  try {
    sharedWs = new WebSocket(getWebSocketUrl())

    sharedWs.onopen = () => {
      sharedIsConnected = true
      sharedIsReady = false
      sharedReconnectCount = 0
      notifyStateChange()
      notifyConnected()
    }

    sharedWs.onmessage = (event) => {
      try {
        const message = normalizeMessage(JSON.parse(event.data as string))
        handleSharedMessage(message)
        emitWsMessage(message)
        notifyMessage(message)
      } catch (error) {
        console.error('[WebSocket] Parse message error:', error)
      }
    }

    sharedWs.onclose = () => {
      sharedIsConnected = false
      sharedIsReady = false
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
  sharedIsReady = false
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
    getSnapshot,
  }
}
