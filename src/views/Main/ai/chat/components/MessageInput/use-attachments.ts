import { computed, onScopeDispose, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { getUploadToken, uploadFileToCloud, validateFile, type UploadConfig } from '@/lib/upload'
import type { AiAgentEffectiveCapabilities } from '@/api/ai/agents'
import {
  attachmentBlockingReason,
  createImagePreview,
  disabledCapabilities,
  generateAttachmentId,
  isCompletedAttachment,
  revokeImagePreview,
  selectAttachmentFiles,
} from './attachment-files'
import type {
  Attachment,
  AttachmentSelectionResult,
  PendingAttachment,
  SeededAttachment,
} from './attachment-files'

export { attachmentIdentity, selectAttachmentFiles } from './attachment-files'
export type {
  Attachment,
  AttachmentKind,
  AttachmentSelectionResult,
  AttachmentStatus,
  PendingAttachment,
  SeededAttachment,
} from './attachment-files'

interface UploadAttempt {
  generation: number
  controller: AbortController
}

export function useAttachments(
  capabilities: MaybeRefOrGetter<AiAgentEffectiveCapabilities | undefined>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const { t } = useI18n()
  const fileInputRef = ref<HTMLInputElement>()
  const pendingAttachments = ref<PendingAttachment[]>([])
  const isDragging = ref(false)
  const uploadAttempts = new Map<string, UploadAttempt>()
  let generation = 0
  const attachmentCapabilities = computed(() => toValue(capabilities)?.attachments ?? disabledCapabilities)
  const isEnabled = computed(() => Boolean(toValue(enabled)))
  const supportsAttachments = computed(() => (
    isEnabled.value
    && (attachmentCapabilities.value.image.enabled || attachmentCapabilities.value.native_file.enabled)
  ))
  const accept = computed(() => {
    const values = new Set<string>()
    if (attachmentCapabilities.value.image.enabled) {
      attachmentCapabilities.value.image.mime_types.forEach((value) => values.add(value))
    }
    if (attachmentCapabilities.value.native_file.enabled) {
      attachmentCapabilities.value.native_file.accepted_extensions
        .forEach((value) => values.add(`.${value}`))
    }
    return Array.from(values).join(',')
  })
  const isLimitReached = computed(() => (
    !supportsAttachments.value
    || pendingAttachments.value.length >= attachmentCapabilities.value.max_attachments_per_message
  ))
  const hasPendingUpload = computed(() => pendingAttachments.value.some((item) => (
    item.status === 'queued' || item.status === 'uploading' || item.status === 'retrying'
  )))
  const hasFailedUpload = computed(() => pendingAttachments.value.some((item) => item.status === 'failed'))
  const blockingReason = computed(() => attachmentBlockingReason(
    pendingAttachments.value,
    attachmentCapabilities.value,
  ))
  const hasIncompatibleAttachment = computed(() => blockingReason.value.length > 0)
  const canSubmitAttachments = computed(() => (
    !hasPendingUpload.value && !hasFailedUpload.value && !hasIncompatibleAttachment.value
  ))

  function setFileInputRef(element: unknown) {
    fileInputRef.value = element as HTMLInputElement | undefined
  }

  function startUploadAttempt(id: string): UploadAttempt {
    uploadAttempts.get(id)?.controller.abort()
    const attempt = {
      generation,
      controller: new AbortController(),
    }
    uploadAttempts.set(id, attempt)
    return attempt
  }

  function currentUploadItem(id: string, attempt: UploadAttempt) {
    if (attempt.generation !== generation
      || attempt.controller.signal.aborted
      || uploadAttempts.get(id) !== attempt) {
      return undefined
    }
    return pendingAttachments.value.find((attachment) => attachment.id === id)
  }

  function cancelUpload(id: string) {
    const attempt = uploadAttempts.get(id)
    if (!attempt) return
    uploadAttempts.delete(id)
    attempt.controller.abort()
  }

  function cancelAllUploads() {
    generation += 1
    const attempts = Array.from(uploadAttempts.values())
    uploadAttempts.clear()
    attempts.forEach((attempt) => attempt.controller.abort())
  }

  async function uploadAttachment(id: string, retry = false) {
    const item = pendingAttachments.value.find((attachment) => attachment.id === id)
    if (!item) return
    const attempt = startUploadAttempt(id)
    item.status = retry ? 'retrying' : 'uploading'
    item.error = undefined
    let config: UploadConfig
    try {
      config = await getUploadToken({
        folderName: 'ai_chat_attachments',
        fileName: item.file.name,
        fileSize: item.file.size,
        fileKind: item.kind,
      }, attempt.controller.signal)
      const tokenOwner = currentUploadItem(id, attempt)
      if (!tokenOwner) return
      validateFile(tokenOwner.file, config, tokenOwner.kind)
      const result = await uploadFileToCloud(tokenOwner.file, config, attempt.controller.signal)
      const uploadOwner = currentUploadItem(id, attempt)
      if (!uploadOwner) return
      uploadOwner.url = result.url
      uploadOwner.objectKey = result.key
      uploadOwner.status = 'uploaded'
    } catch {
      const failureOwner = currentUploadItem(id, attempt)
      if (!failureOwner) return
      failureOwner.status = 'failed'
      failureOwner.error = t('aiChat.uploadFailed')
      ElNotification.error({ message: failureOwner.error })
    } finally {
      if (uploadAttempts.get(id) === attempt) uploadAttempts.delete(id)
    }
  }

  function notifySelection(result: AttachmentSelectionResult) {
    if (result.rejected.unsupported > 0) ElNotification.warning({ message: t('aiChat.attachmentTypeUnsupported') })
    if (result.rejected.tooLarge > 0) ElNotification.warning({ message: t('aiChat.attachmentTooLarge') })
    if (result.rejected.limit > 0) ElNotification.warning({ message: t('aiChat.maxAttachmentsReached', {
      max: attachmentCapabilities.value.max_attachments_per_message,
    }) })
    if (result.rejected.totalSize > 0) ElNotification.warning({ message: t('aiChat.attachmentTotalTooLarge') })
    if (result.rejected.duplicate > 0) ElNotification.warning({ message: t('aiChat.attachmentDuplicate') })
  }

  async function addFiles(files: FileList | readonly File[]) {
    if (!isEnabled.value) {
      ElNotification.warning({ message: t('aiChat.selectAgentFirst') })
      return
    }
    const result = selectAttachmentFiles(
      Array.from(files),
      attachmentCapabilities.value,
      pendingAttachments.value,
    )
    notifySelection(result)
    const selectionGeneration = generation
    const additions: PendingAttachment[] = []
    for (const candidate of result.accepted) {
      const preview = candidate.kind === 'image' ? await createImagePreview(candidate.file) : undefined
      if (selectionGeneration !== generation) {
        revokeImagePreview(preview)
        additions.forEach((item) => revokeImagePreview(item.preview))
        return
      }
      additions.push({
        id: generateAttachmentId(),
        identity: candidate.identity,
        kind: candidate.kind,
        file: candidate.file,
        name: candidate.file.name,
        mimeType: candidate.file.type || 'application/octet-stream',
        size: candidate.file.size,
        preview,
        status: 'queued',
      })
    }
    if (selectionGeneration !== generation) {
      additions.forEach((item) => revokeImagePreview(item.preview))
      return
    }
    pendingAttachments.value.push(...additions)
    await Promise.all(additions.map((item) => uploadAttachment(item.id)))
  }

  const handleUploadClick = () => fileInputRef.value?.click()

  function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files?.length) return
    void addFiles(input.files)
    input.value = ''
  }

  function removeAttachment(id: string) {
    const index = pendingAttachments.value.findIndex((attachment) => attachment.id === id)
    if (index < 0) return
    cancelUpload(id)
    revokeImagePreview(pendingAttachments.value[index]?.preview)
    pendingAttachments.value.splice(index, 1)
  }

  function clearAttachments(ids?: readonly string[]) {
    const removed = ids ? new Set(ids) : undefined
    if (!removed) cancelAllUploads()
    const kept: PendingAttachment[] = []
    for (const item of pendingAttachments.value) {
      if (!removed || removed.has(item.id)) {
        if (removed) cancelUpload(item.id)
        revokeImagePreview(item.preview)
      }
      else kept.push(item)
    }
    pendingAttachments.value = kept
  }

  function handlePaste(event: ClipboardEvent) {
    const files = Array.from(event.clipboardData?.items ?? [])
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null)
    if (files.length === 0) return
    event.preventDefault()
    void addFiles(files)
  }

  function handleDragOver(event: DragEvent) {
    if (!supportsAttachments.value) return
    event.preventDefault()
    isDragging.value = true
  }

  function handleDragLeave(event: DragEvent) {
    if (!supportsAttachments.value) return
    event.preventDefault()
    isDragging.value = false
  }

  function handleDrop(event: DragEvent) {
    if (!isEnabled.value || !event.dataTransfer?.files.length) return
    event.preventDefault()
    isDragging.value = false
    void addFiles(event.dataTransfer.files)
  }

  function retryAttachment(id: string) {
    return uploadAttachment(id, true)
  }

  function seedAttachments(items: readonly SeededAttachment[]) {
    clearAttachments()
    pendingAttachments.value = items.map((item) => ({
      id: generateAttachmentId(),
      identity: `${item.type}\u0000${item.object_key}\u0000${item.name}\u0000${item.size}`,
      kind: item.type,
      file: new File([], item.name, { type: item.mime_type ?? 'application/octet-stream' }),
      name: item.name,
      mimeType: item.mime_type ?? 'application/octet-stream',
      size: item.size,
      preview: item.type === 'image' ? item.url : undefined,
      status: 'uploaded',
      url: item.url,
      objectKey: item.object_key,
    }))
  }

  function completedAttachments(): Attachment[] {
    return pendingAttachments.value
      .filter(isCompletedAttachment)
      .map((item) => ({
        request: {
          type: item.kind,
          object_key: item.objectKey,
          url: item.url,
          mime_type: item.mimeType,
          name: item.name,
          size: item.size,
        },
        preview: {
          type: item.kind,
          object_key: item.objectKey,
          url: item.url,
          mime_type: item.mimeType,
          name: item.name,
          size: item.size,
        },
      }))
  }

  onScopeDispose(cancelAllUploads)

  return {
    setFileInputRef,
    pendingAttachments,
    isDragging,
    supportsAttachments,
    accept,
    isLimitReached,
    hasPendingUpload,
    hasFailedUpload,
    hasIncompatibleAttachment,
    blockingReason,
    canSubmitAttachments,
    addFiles,
    completedAttachments,
    handleUploadClick,
    handleFileChange,
    removeAttachment,
    clearAttachments,
    retryAttachment,
    seedAttachments,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}
