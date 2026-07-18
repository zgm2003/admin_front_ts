export interface RealtimeCloseEvent {
  readonly code: number
  readonly reason: string
}

export interface RealtimeTransportHandlers {
  open(): void
  message(payload: string): void
  close(event: RealtimeCloseEvent): void
  error(error: unknown): void
}

export interface RealtimeConnection {
  send(payload: string): void
  close(): void
}

export interface RealtimeTransport {
  connect(url: string, handlers: RealtimeTransportHandlers): RealtimeConnection
}
