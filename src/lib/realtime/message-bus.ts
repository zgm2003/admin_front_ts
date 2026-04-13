export type MessageType = 'init' | 'pong' | 'bind_success' | 'error' | 'notification' | 'broadcast' | string

export type WsMessageData = Record<string, unknown>

export interface WsMessage<T extends WsMessageData = WsMessageData> {
  type: MessageType
  data: T
}

export type MessageHandler<T extends WsMessageData = WsMessageData> = (message: WsMessage<T>) => void

const globalHandlers = new Map<string, Set<MessageHandler>>()

export function emitWsMessage<T extends WsMessageData>(message: WsMessage<T>) {
  const handlers = globalHandlers.get(message.type)
  handlers?.forEach((handler) => handler(message))
}

export function onWsMessage<T extends WsMessageData>(type: string, handler: MessageHandler<T>): () => void {
  if (!globalHandlers.has(type)) {
    globalHandlers.set(type, new Set())
  }

  globalHandlers.get(type)!.add(handler as MessageHandler)

  return () => {
    globalHandlers.get(type)?.delete(handler as MessageHandler)
  }
}

export function offWsMessage<T extends WsMessageData>(type: string, handler?: MessageHandler<T>) {
  if (handler) {
    globalHandlers.get(type)?.delete(handler as MessageHandler)
    return
  }

  globalHandlers.delete(type)
}
