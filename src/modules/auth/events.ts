import type { AuthEvent } from './types'

export class AuthEventBus {
  private readonly listeners = new Set<(event: AuthEvent) => void>()

  subscribe(listener: (event: AuthEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  emit(event: AuthEvent) {
    for (const listener of this.listeners) {
      listener(event)
    }
  }

  clear() {
    this.listeners.clear()
  }
}
