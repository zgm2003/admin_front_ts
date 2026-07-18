import { vi } from 'vitest'

export interface FakeClock {
  advanceBy(milliseconds: number): Promise<void>
  restore(): void
}

export function installFakeClock(now: string | number | Date): FakeClock {
  vi.useFakeTimers()
  vi.setSystemTime(now)

  return {
    advanceBy(milliseconds) {
      return vi.advanceTimersByTimeAsync(milliseconds)
    },
    restore() {
      vi.useRealTimers()
    },
  }
}
