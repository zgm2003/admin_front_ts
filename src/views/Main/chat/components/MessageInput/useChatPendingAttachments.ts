import { onUnmounted, ref } from 'vue'

export interface PendingAttachment {
  id: string
  file: File
  type: 'image' | 'file'
  previewUrl?: string
}

export function useChatPendingAttachments() {
  const pendingAttachments = ref<PendingAttachment[]>([])

  function createPendingId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  function addPendingImage(file: File) {
    pendingAttachments.value.push({
      id: createPendingId(),
      file,
      type: 'image',
      previewUrl: URL.createObjectURL(file),
    })
  }

  function addPendingFile(file: File) {
    pendingAttachments.value.push({
      id: createPendingId(),
      file,
      type: 'file',
    })
  }

  function addPendingAttachment(file: File) {
    if (file.type.startsWith('image/')) {
      addPendingImage(file)
      return
    }

    addPendingFile(file)
  }

  function removePending(id: string) {
    const idx = pendingAttachments.value.findIndex(attachment => attachment.id === id)
    if (idx === -1) return

    const found = pendingAttachments.value[idx]
    if (found?.previewUrl) URL.revokeObjectURL(found.previewUrl)
    pendingAttachments.value.splice(idx, 1)
  }

  function releasePendingAttachments(attachments: readonly PendingAttachment[]) {
    for (const attachment of attachments) {
      if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl)
    }
  }

  function drainPendingAttachments() {
    const attachments = [...pendingAttachments.value]
    pendingAttachments.value = []
    return attachments
  }

  function clearPendingAttachments() {
    releasePendingAttachments(pendingAttachments.value)
    pendingAttachments.value = []
  }

  onUnmounted(clearPendingAttachments)

  return {
    pendingAttachments,
    addPendingAttachment,
    removePending,
    releasePendingAttachments,
    drainPendingAttachments,
  }
}
