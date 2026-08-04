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

export type CompletedAttachment = PendingAttachment & {
  status: 'uploaded'
  url: string
  objectKey: string
}

export function isCompletedAttachment(item: PendingAttachment): item is CompletedAttachment {
  return item.status === 'uploaded' && Boolean(item.url) && Boolean(item.objectKey)
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

export const disabledCapabilities: AiAgentEffectiveCapabilities['attachments'] = {
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

export const generateAttachmentId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

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

export function createImagePreview(file: File): Promise<string> {
  if (typeof URL.createObjectURL === 'function') return Promise.resolve(URL.createObjectURL(file))
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(String(event.target?.result ?? ''))
    reader.readAsDataURL(file)
  })
}

export function revokeImagePreview(value?: string) {
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

export function attachmentBlockingReason(
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
