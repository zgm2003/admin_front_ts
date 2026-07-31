import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { getUploadToken, uploadFileToCloud, validateFile, type UploadConfig } from '@/lib/upload'
import type { AiAgentEffectiveCapabilities } from '@/api/ai/agents'
import type { AiChatAttachment, AiMessageAttachmentRequest } from '@/api/ai/messages'

export type AttachmentKind = 'image' | 'file'
export type AttachmentStatus = 'queued' | 'uploading' | 'uploaded' | 'failed' | 'retrying'

export interface Attachment {
  request: AiMessageAttachmentRequest
  preview: AiChatAttachment
}

export interface PendingAttachment {
  id: string
  identity: string
  kind: AttachmentKind
  file: File
  name: string
  mimeType: string
  size: number
  preview?: string
  status: AttachmentStatus
  url?: string
  objectKey?: string
  error?: string
}

export interface SeededAttachment {
  type: AttachmentKind
  object_key: string
  url: string
  mime_type?: string
  name: string
  size: number
}

interface SelectionRejections {
  unsupported: number
  tooLarge: number
  limit: number
  duplicate: number
  totalSize: number
}

interface SelectedFile {
  file: File
  kind: AttachmentKind
  identity: string
}

export interface AttachmentSelectionResult {
  accepted: SelectedFile[]
  rejected: SelectionRejections
}

const disabledCapabilities: AiAgentEffectiveCapabilities['attachments'] = {
  max_attachments_per_message: 0,
  max_message_attachment_bytes: 0,
  image: { enabled: false, mime_types: [], max_files: 0, max_file_bytes: 0 },
  native_file: {
    enabled: false,
    disabled_reason: 'official_model_unsupported',
    max_files_per_message: 0,
    max_file_bytes_exclusive: 0,
    max_request_file_bytes: 0,
    accepted_extensions: [],
  },
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

export const attachmentIdentity = (file: File) => (
  [file.name, file.size, file.lastModified, file.type].join('\u0000')
)

function extension(name: string) {
  const index = name.lastIndexOf('.')
  return index > -1 ? name.slice(index + 1).toLowerCase() : ''
}

function classifyFile(
  file: File,
  capabilities: AiAgentEffectiveCapabilities['attachments'],
): AttachmentKind | undefined {
  if (file.type.startsWith('image/')) {
    return capabilities.image.enabled && capabilities.image.mime_types.includes(file.type)
      ? 'image'
      : undefined
  }
  const ext = extension(file.name)
  return capabilities.native_file.enabled
    && ext.length > 0
    && capabilities.native_file.accepted_extensions.includes(ext)
    ? 'file'
    : undefined
}

export function selectAttachmentFiles(
  files: readonly File[],
  capabilities: AiAgentEffectiveCapabilities['attachments'],
  existing: readonly PendingAttachment[],
): AttachmentSelectionResult {
  const accepted: SelectedFile[] = []
  const rejected: SelectionRejections = {
    unsupported: 0,
    tooLarge: 0,
    limit: 0,
    duplicate: 0,
    totalSize: 0,
  }
  const identities = new Set(existing.map((item) => item.identity))
  let imageCount = existing.filter((item) => item.kind === 'image').length
  let nativeFileCount = existing.filter((item) => item.kind === 'file').length
  let totalBytes = existing.reduce((sum, item) => sum + item.size, 0)

  for (const file of files) {
    const identity = attachmentIdentity(file)
    if (identities.has(identity)) {
      rejected.duplicate += 1
      continue
    }
    const kind = classifyFile(file, capabilities)
    if (!kind) {
      rejected.unsupported += 1
      continue
    }
    const tooLarge = kind === 'image'
      ? file.size > capabilities.image.max_file_bytes
      : file.size >= capabilities.native_file.max_file_bytes_exclusive
    if (tooLarge) {
      rejected.tooLarge += 1
      continue
    }
    if (existing.length + accepted.length >= capabilities.max_attachments_per_message
      || (kind === 'image' && imageCount >= capabilities.image.max_files)
      || (kind === 'file' && nativeFileCount >= capabilities.native_file.max_files_per_message)) {
      rejected.limit += 1
      continue
    }
    if (file.size > capabilities.max_message_attachment_bytes - totalBytes) {
      rejected.totalSize += 1
      continue
    }
    identities.add(identity)
    accepted.push({ file, kind, identity })
    totalBytes += file.size
    if (kind === 'image') imageCount += 1
    else nativeFileCount += 1
  }
  return { accepted, rejected }
}

function createImagePreview(file: File): Promise<string> {
  if (typeof URL.createObjectURL === 'function') return Promise.resolve(URL.createObjectURL(file))
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(String(event.target?.result ?? ''))
    reader.readAsDataURL(file)
  })
}

function revokeImagePreview(value?: string) {
  if (value?.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(value)
  }
}

function isCompatible(
  item: PendingAttachment,
  capabilities: AiAgentEffectiveCapabilities['attachments'],
  index: number,
  items: readonly PendingAttachment[],
) {
  if (items.length > capabilities.max_attachments_per_message) return false
  const total = items.reduce((sum, candidate) => sum + candidate.size, 0)
  if (total > capabilities.max_message_attachment_bytes) return false
  if (item.kind === 'image') {
    const imageIndex = items.slice(0, index + 1).filter((candidate) => candidate.kind === 'image').length
    return capabilities.image.enabled
      && capabilities.image.mime_types.includes(item.mimeType)
      && item.size <= capabilities.image.max_file_bytes
      && imageIndex <= capabilities.image.max_files
  }
  return capabilities.native_file.enabled
    && capabilities.native_file.accepted_extensions.includes(extension(item.name))
    && item.size < capabilities.native_file.max_file_bytes_exclusive
    && items.slice(0, index + 1).filter((candidate) => candidate.kind === 'file').length
      <= capabilities.native_file.max_files_per_message
}

function attachmentBlockingReason(
  items: readonly PendingAttachment[],
  capabilities: AiAgentEffectiveCapabilities['attachments'],
) {
  if (items.length > capabilities.max_attachments_per_message) return 'too_many'
  const total = items.reduce((sum, item) => sum + item.size, 0)
  if (total > capabilities.max_message_attachment_bytes) return 'message_total_too_large'
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]!
    if (isCompatible(item, capabilities, index, items)) continue
    if (item.kind === 'file' && !capabilities.native_file.enabled) {
      return capabilities.native_file.disabled_reason || 'official_model_unsupported'
    }
    return item.kind === 'image' ? 'image_unsupported' : 'type_unsupported'
  }
  return ''
}

export function useAttachments(
  capabilities: MaybeRefOrGetter<AiAgentEffectiveCapabilities | undefined>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const { t } = useI18n()
  const fileInputRef = ref<HTMLInputElement>()
  const pendingAttachments = ref<PendingAttachment[]>([])
  const isDragging = ref(false)
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

  async function uploadAttachment(id: string, retry = false) {
    const item = pendingAttachments.value.find((attachment) => attachment.id === id)
    if (!item) return
    item.status = retry ? 'retrying' : 'uploading'
    item.error = undefined
    let config: UploadConfig
    try {
      config = await getUploadToken({
        folderName: 'ai_chat_attachments',
        fileName: item.file.name,
        fileSize: item.file.size,
        fileKind: item.kind,
      })
      validateFile(item.file, config, item.kind)
      const result = await uploadFileToCloud(item.file, config)
      item.url = result.url
      item.objectKey = result.key
      item.status = 'uploaded'
    } catch {
      item.status = 'failed'
      item.error = t('aiChat.uploadFailed')
      ElNotification.error({ message: item.error })
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
    const additions: PendingAttachment[] = []
    for (const candidate of result.accepted) {
      additions.push({
        id: generateId(),
        identity: candidate.identity,
        kind: candidate.kind,
        file: candidate.file,
        name: candidate.file.name,
        mimeType: candidate.file.type || 'application/octet-stream',
        size: candidate.file.size,
        preview: candidate.kind === 'image' ? await createImagePreview(candidate.file) : undefined,
        status: 'queued',
      })
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
    revokeImagePreview(pendingAttachments.value[index]?.preview)
    pendingAttachments.value.splice(index, 1)
  }

  function clearAttachments(ids?: readonly string[]) {
    const removed = ids ? new Set(ids) : undefined
    const kept: PendingAttachment[] = []
    for (const item of pendingAttachments.value) {
      if (!removed || removed.has(item.id)) revokeImagePreview(item.preview)
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
      id: generateId(),
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
      .filter((item) => item.status === 'uploaded' && item.url && item.objectKey)
      .map((item) => ({
        request: {
          type: item.kind,
          object_key: item.objectKey as string,
          url: item.url as string,
          mime_type: item.mimeType,
          name: item.name,
          size: item.size,
        },
        preview: {
          type: item.kind,
          object_key: item.objectKey as string,
          url: item.url as string,
          mime_type: item.mimeType,
          name: item.name,
          size: item.size,
        } as unknown as AiChatAttachment,
      }))
  }

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
