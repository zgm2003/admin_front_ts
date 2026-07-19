export function createConversationTitle(content: string): string {
  const normalized = content.trim().replace(/\s+/g, ' ')
  return normalized.length > 30 ? normalized.slice(0, 30) : normalized
}
