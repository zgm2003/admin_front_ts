export function createConversationTitle(content: string, firstAttachmentName = ''): string {
  const source = content.trim() ? content : firstAttachmentName
  const normalized = source.trim().replace(/\s+/g, ' ')
  return normalized.length > 30 ? normalized.slice(0, 30) : normalized
}
