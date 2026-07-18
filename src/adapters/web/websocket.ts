import type {
  RealtimeConnection,
  RealtimeTransport,
  RealtimeTransportHandlers,
} from '@/modules/realtime/transport'

export const ADMIN_REALTIME_PATH = '/api/admin/v1/realtime/ws'

export function buildRealtimeWebSocketURL(endpoint: URL, ticketInput: string): string {
  const ticket = ticketInput
  if (!ticket) throw new TypeError('realtime ticket is required')
  if (endpoint.protocol !== 'ws:' && endpoint.protocol !== 'wss:') {
    throw new TypeError('realtime endpoint must use WS or WSS')
  }
  if (endpoint.username || endpoint.password || endpoint.hash || endpoint.search) {
    throw new TypeError('realtime endpoint must not contain credentials, query, or fragment')
  }
  if (endpoint.pathname !== ADMIN_REALTIME_PATH) {
    throw new TypeError(`realtime endpoint must use ${ADMIN_REALTIME_PATH}`)
  }
  const url = new URL(endpoint.href)
  url.searchParams.set('ticket', ticket)
  return url.toString()
}

export class BrowserWebSocketTransport implements RealtimeTransport {
  connect(url: string, handlers: RealtimeTransportHandlers): RealtimeConnection {
    const socket = new WebSocket(url)
    socket.addEventListener('open', () => handlers.open())
    socket.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') {
        handlers.error(new TypeError('realtime WebSocket accepts text frames only'))
        return
      }
      handlers.message(event.data)
    })
    socket.addEventListener('close', (event) => handlers.close({
      code: event.code,
      reason: event.reason,
    }))
    socket.addEventListener('error', () => {
      handlers.error(new Error('realtime WebSocket transport error'))
    })
    return {
      send(payload) {
        if (socket.readyState !== WebSocket.OPEN) {
          throw new DOMException('realtime WebSocket is not open', 'InvalidStateError')
        }
        socket.send(payload)
      },
      close() {
        if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) return
        socket.close(1000, 'client disconnect')
      },
    }
  }
}
