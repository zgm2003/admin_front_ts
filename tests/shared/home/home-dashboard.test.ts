import { describe, expect, it } from 'vitest'

describe('home dashboard helpers', async () => {
  const { resolveHomeNavigationAction } = await import('../../../src/views/Main/home/composables/helpers')

  it('distinguishes internal routes from external notification links', () => {
    expect(resolveHomeNavigationAction('')).toEqual({ type: 'none' })
    expect(resolveHomeNavigationAction('/notification')).toEqual({ type: 'internal', value: '/notification' })
    expect(resolveHomeNavigationAction('https://example.com/notice')).toEqual({
      type: 'external',
      value: 'https://example.com/notice',
    })
  })
})
