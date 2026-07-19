import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { getUploadToken, uploadFileToCloud, validateFile, type UploadConfig } from '@/lib/upload'

export interface Attachment {
  type: 'image'
  url: string
  name: string
  size: number
}

export interface PendingAttachment {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  url?: string
  error?: string
}

const MAX_IMAGES = 5

function createPreview(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(event.target?.result as string)
    reader.readAsDataURL(file)
  })
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

export function useImageAttachments() {
  const { t } = useI18n()
  const fileInputRef = ref<HTMLInputElement>()
  const pendingAttachments = ref<PendingAttachment[]>([])
  const isDragging = ref(false)
  const supportsImage = computed(() => true)
  const isImageLimitReached = computed(() => pendingAttachments.value.length >= MAX_IMAGES)

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

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    const availableSlots = MAX_IMAGES - pendingAttachments.value.length
    if (availableSlots <= 0) {
      ElNotification.warning({ message: t('aiChat.maxImagesReached', { max: MAX_IMAGES }) })
      return
    }

    const filesToAdd = imageFiles.slice(0, availableSlots)
    if (filesToAdd.length < imageFiles.length) {
      ElNotification.warning({ message: t('aiChat.maxImagesReached', { max: MAX_IMAGES }) })
    }

    for (const file of filesToAdd) {
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
    event.preventDefault()
    isDragging.value = false
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDragging.value = false
    if (supportsImage.value && event.dataTransfer?.files.length) {
      void addImageFiles(event.dataTransfer.files)
    }
  }

  return {
    setFileInputRef,
    pendingAttachments,
    isDragging,
    supportsImage,
    isImageLimitReached,
    handleUploadClick,
    handleFileChange,
    removeAttachment,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}
