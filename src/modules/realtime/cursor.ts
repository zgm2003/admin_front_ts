import { z } from 'zod'
import { defineCodec } from '@/modules/persistence/codec'
import { userNamespace, type UserNamespace } from '@/modules/persistence/namespaces'
import type { Persistence } from '@/modules/persistence/store'

const CURSOR_KEY = 'realtime-cursor'

export const realtimeCursorCodec = defineCodec<number>({
  version: 1,
  maxBytes: 128,
  schema: z.number().int().nonnegative().refine(Number.isSafeInteger),
})

export class RealtimeCursorStore {
  private readonly persistence: Persistence
  private namespace: UserNamespace | null = null
  private value = 0

  constructor(persistence: Persistence) {
    this.persistence = persistence
  }

  get current(): number {
    return this.value
  }

  activate(userId: number): void {
    this.namespace = userNamespace(userId)
    this.value = this.persistence.read(this.namespace, CURSOR_KEY, realtimeCursorCodec) ?? 0
  }

  set(value: number): void {
    if (!this.namespace) return
    this.persistence.write(this.namespace, CURSOR_KEY, realtimeCursorCodec, value)
    this.value = value
  }

  reset(purge: boolean): void {
    try {
      if (purge && this.namespace) this.persistence.remove(this.namespace, CURSOR_KEY)
    } finally {
      this.namespace = null
      this.value = 0
    }
  }
}
