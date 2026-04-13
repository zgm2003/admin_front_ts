import { describe, expect, it, vi } from 'vitest'

const { createDebouncedNotifier } = await import('../../../src/lib/http/notifier')

describe('http notifier', () => {
  it('deduplicates repeated messages within the debounce window', () => {
    const notify = vi.fn()
    let now = 1000
    const notifier = createDebouncedNotifier({
      notify,
      debounceMs: 2000,
      now: () => now,
    })

    notifier('same-message')
    notifier('same-message')
    now = 4001
    notifier('same-message')

    expect(notify).toHaveBeenCalledTimes(2)
    expect(notify).toHaveBeenNthCalledWith(1, 'same-message')
    expect(notify).toHaveBeenNthCalledWith(2, 'same-message')
  })
})
