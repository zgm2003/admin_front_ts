import { describe, expect, it } from 'vitest'
import { normalizeNotificationLink } from '@/lib/navigation/notification-link'

describe('normalizeNotificationLink', () => {
  it('maps legacy export task routes to the current system route', () => {
    expect(normalizeNotificationLink('/devTools/exportTask')).toBe('/system/exportTask')
    expect(normalizeNotificationLink('/devTools/exportTask?status=2')).toBe('/system/exportTask?status=2')
  })

  it('keeps non-legacy links unchanged', () => {
    expect(normalizeNotificationLink('/chat')).toBe('/chat')
    expect(normalizeNotificationLink('https://example.com')).toBe('https://example.com')
  })
})
