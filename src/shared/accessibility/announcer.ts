export type AnnouncementPriority = 'polite' | 'assertive'

export interface AccessibilityAnnouncement {
  readonly id: number
  readonly message: string
  readonly priority: AnnouncementPriority
}

type AnnouncementListener = (announcement: AccessibilityAnnouncement) => void

const listeners = new Set<AnnouncementListener>()
let announcementId = 0

export function announce(message: string, priority: AnnouncementPriority = 'polite'): void {
  const normalized = message.trim()
  if (!normalized) return
  const announcement = { id: ++announcementId, message: normalized, priority } as const
  for (const listener of listeners) listener(announcement)
}

export function announcePolite(message: string): void {
  announce(message, 'polite')
}

export function announceAssertive(message: string): void {
  announce(message, 'assertive')
}

export function subscribeToAnnouncements(listener: AnnouncementListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
