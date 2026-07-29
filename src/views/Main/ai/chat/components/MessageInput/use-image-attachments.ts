import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { getUploadToken, uploadFileToCloud, validateFile, type UploadConfig } from '@/lib/upload'
import type { AiAgentEffectiveCapabilities } from '@/api/ai/agents'
import type { AiChatAttachment, AiMessageAttachmentRequest } from '@/api/ai/messages'

export interface Attachment {
  request: AiMessageAttachmentRequest
  preview: AiChatAttachment
}

export interface PendingAttachment {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  url?: string
  objectKey?: string
  error?: string
}

export interface ImageFileCandidate {
  name: string
  type: string
  size: number
}

export interface ImageSelectionResult<T> {
  accepted: T[]
  rejected: { type: number; size: number; limit: number }
}

export function selectImageFiles<T extends ImageFileCandidate>(
  files: readonly T[],
  capability: { enabled: boolean; mime_types: string[]; max_files: number; max_file_bytes: number },
  currentCount: number,
): ImageSelectionResult<T> {
  const accepted: T[] = []
  const rejected = { type: 0, size: 0, limit: 0 }
  const mimeTypes = new Set(capability.mime_types)
  for (const file of files) {
    if (!capability.enabled || !mimeTypes.has(file.type)) {
      rejected.type += 1
      continue
    }
    if (file.size > capability.max_file_bytes) {
      rejected.size += 1
      continue
    }
    if (currentCount + accepted.length >= capability.max_files) {
      rejected.limit += 1
      continue
    }
    accepted.push(file)
  }
  return { accepted, rejected }
}

function createPreview(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(event.target?.result as string)
    reader.readAsDataURL(file)
  })
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

type ImageCapability = AiAgentEffectiveCapabilities['attachments']['image']

const disabledImageCapability: ImageCapability = {
  enabled: false,
  mime_types: [],
  max_files: 0,
  max_file_bytes: 0,
}

export function useImageAttachments(capability: MaybeRefOrGetter<ImageCapability | undefined>) {
  const { t } = useI18n()
  const fileInputRef = ref<HTMLInputElement>()
  const pendingAttachments = ref<PendingAttachment[]>([])
  const isDragging = ref(false)
  const imageCapability = computed(() => toValue(capability) ?? disabledImageCapability)
  const supportsImage = computed(() => imageCapability.value.enabled)
  const imageAccept = computed(() => imageCapability.value.mime_types.join(','))
  const isImageLimitReached = computed(() => (
    !supportsImage.value
    || pendingAttachments.value.length >= imageCapability.value.max_files
  ))

  function setFileInputRef(element: unknown) {
    fileInputRef.value = element as HTMLInputElement | undefined
  }

  async function uploadFile(pending: PendingAttachment) {
    const item = pendingAttachments.value.find((attachment) => attachment.id === pending.id)
    if (!item) return

    item.status = 'uploading'
    let config: UploadConfig
    try {
      config = await getUploadToken({
        folderName: 'ai_chat_images',
        fileName: pending.file.name,
        fileSize: pending.file.size,
        fileKind: 'image',
      })
    } catch {
      item.status = 'error'
      item.error = t('aiChat.tokenError')
      ElNotification.error({ message: item.error })
      return
    }

    try {
      validateFile(pending.file, config, 'image')
    } catch (error: unknown) {
      item.status = 'error'
      item.error = error instanceof Error ? error.message : t('aiChat.uploadFailed')
      ElNotification.error({ message: item.error })
      return
    }

    try {
      const result = await uploadFileToCloud(pending.file, config)
      item.url = result.url
      item.objectKey = result.key
      item.status = 'done'
    } catch {
      item.status = 'error'
      item.error = t('aiChat.networkError')
      ElNotification.error({ message: item.error })
    }
  }

  async function addImageFiles(files: FileList | File[]) {
    if (!supportsImage.value) {
      ElNotification.warning({ message: t('aiChat.modelNotSupportImage') })
      return
    }

    const selection = selectImageFiles(
      Array.from(files),
      imageCapability.value,
      pendingAttachments.value.length,
    )
    if (selection.rejected.type > 0) {
      ElNotification.warning({ message: t('aiChat.imageTypeUnsupported') })
    }
    if (selection.rejected.size > 0) {
      ElNotification.warning({
        message: t('aiChat.imageTooLarge', { max: imageCapability.value.max_file_bytes }),
      })
    }
    if (selection.rejected.limit > 0) {
      ElNotification.warning({
        message: t('aiChat.maxImagesReached', { max: imageCapability.value.max_files }),
      })
    }

    for (const file of selection.accepted) {
      const pending: PendingAttachment = {
        id: generateId(),
        file,
        preview: await createPreview(file),
        status: 'pending',
      }
      pendingAttachments.value.push(pending)
      void uploadFile(pending)
    }
  }

  const handleUploadClick = () => fileInputRef.value?.click()

  function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files?.length) return
    void addImageFiles(input.files)
    input.value = ''
  }

  function removeAttachment(id: string) {
    const index = pendingAttachments.value.findIndex((attachment) => attachment.id === id)
    if (index !== -1) pendingAttachments.value.splice(index, 1)
  }

  function clearAttachments(ids?: readonly string[]) {
    if (!ids) {
      pendingAttachments.value = []
      return
    }
    const removed = new Set(ids)
    pendingAttachments.value = pendingAttachments.value.filter((item) => !removed.has(item.id))
  }

  function handlePaste(event: ClipboardEvent) {
    if (!supportsImage.value || !event.clipboardData?.items) return
    const imageFiles = Array.from(event.clipboardData.items)
      .filter((item) => item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null)
    if (imageFiles.length === 0) return
    event.preventDefault()
    void addImageFiles(imageFiles)
  }

  function handleDragOver(event: DragEvent) {
    if (!supportsImage.value) return
    event.preventDefault()
    isDragging.value = true
  }

  function handleDragLeave(event: DragEvent) {
    if (!supportsImage.value) return
    event.preventDefault()
    isDragging.value = false
  }

  function handleDrop(event: DragEvent) {
    if (!supportsImage.value) return
    event.preventDefault()
    isDragging.value = false
    if (event.dataTransfer?.files.length) {
      void addImageFiles(event.dataTransfer.files)
    }
  }

  return {
    setFileInputRef,
    pendingAttachments,
    isDragging,
    supportsImage,
    imageAccept,
    isImageLimitReached,
    handleUploadClick,
    handleFileChange,
    removeAttachment,
    clearAttachments,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}
