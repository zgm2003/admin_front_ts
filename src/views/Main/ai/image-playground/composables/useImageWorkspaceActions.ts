import { computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { CommonEnum } from '@/enums'
import { AiAssetApi, type AiAssetItem, type AiAssetMutationParams } from '@/api/ai/assets'
import { AiImageApi, type AiImageDetailResponse, type AiImageFileInput, type AiImageFileItem } from '@/api/ai/images'
import type { ImageComposerFile, ImageComposerState } from '../types'

export const IMAGE_REFERENCE_LIMIT = 10

interface UseImageWorkspaceActionsOptions {
  composer: Ref<ImageComposerState>
  selectedTaskId: Ref<number | null>
  detail: Ref<AiImageDetailResponse | null>
  createComposerFile: (input: AiImageFileInput) => ImageComposerFile
  toImageFileInput: (file: ImageComposerFile | AiImageFileItem) => AiImageFileInput
  refreshList: () => Promise<void>
}

export function useImageWorkspaceActions(options: UseImageWorkspaceActionsOptions) {
  const { t } = useI18n()

  const canAddReference = computed(() => options.composer.value.input_files.length < IMAGE_REFERENCE_LIMIT)
  const referenceLimitReachedMessage = computed(() => t('aiImages.referenceLimitReached', { max: IMAGE_REFERENCE_LIMIT }))

  function ensureReferenceCapacity(): boolean {
    if (canAddReference.value) return true
    ElMessage.warning(referenceLimitReachedMessage.value)
    return false
  }

  function appendReference(input: AiImageFileInput): boolean {
    if (!ensureReferenceCapacity()) return false
    options.composer.value.input_files = [
      ...options.composer.value.input_files,
      options.createComposerFile(input),
    ]
    return true
  }

  async function addAssetReference(asset: AiAssetItem) {
    try {
      if (!ensureReferenceCapacity()) return
      if (asset.type !== 'image') {
        throw new Error(t('aiImages.assetTypeRequired'))
      }
      const url = requireNonEmptyURL(asset.url, t('aiImages.assetUrlRequired'))
      const dimensions = await readImageDimensionsFromURL(url)
      const appended = appendReference({
        storage_provider: 'remote_url',
        storage_key: url,
        storage_url: url,
        mime_type: imageMimeTypeFromURL(url),
        width: dimensions.width,
        height: dimensions.height,
        size_bytes: 0,
      })
      if (appended) {
        ElMessage.success(t('aiImages.addReferenceDone'))
      }
    } catch (error: unknown) {
      notifyError(error, t('aiImages.addReferenceFailed'))
    }
  }

  async function addClipboardReference() {
    try {
      if (!ensureReferenceCapacity()) return
      const url = requireNonEmptyURL(await navigator.clipboard.readText(), t('aiImages.clipboardReferenceRequired'))
      const dimensions = await readImageDimensionsFromURL(url)
      const appended = appendReference({
        storage_provider: 'remote_url',
        storage_key: url,
        storage_url: url,
        mime_type: imageMimeTypeFromURL(url),
        width: dimensions.width,
        height: dimensions.height,
        size_bytes: 0,
      })
      if (appended) {
        ElMessage.success(t('aiImages.addReferenceDone'))
      }
    } catch (error: unknown) {
      notifyError(error, t('aiImages.addReferenceFailed'))
    }
  }

  function addReference(file: AiImageFileItem) {
    const appended = appendReference(options.toImageFileInput(file))
    if (appended) {
      ElMessage.success(t('aiImages.addReferenceDone'))
    }
  }

  function appendUploadedReference(input: AiImageFileInput): boolean {
    return appendReference(input)
  }

  async function saveAsset(file: AiImageFileItem, source: AiImageDetailResponse) {
    try {
      const payload: AiAssetMutationParams = {
        slug: `image-task-${source.task.id}-file-${file.id}`,
        type: 'image',
        category: 'image-workspace',
        title: t('aiImages.generatedAssetTitle', { id: file.id }),
        cover_url: file.storage_url,
        description: source.task.prompt,
        content: assetContent(file),
        url: file.storage_url,
        tags_json: '[]',
        status: CommonEnum.YES,
      }
      await AiAssetApi.create(payload)
      ElMessage.success(t('aiImages.saveAssetDone'))
    } catch (error: unknown) {
      notifyError(error, t('aiImages.saveAssetFailed'))
    }
  }

  async function deleteSelected(ids: number[]) {
    let confirmed = false
    let deletedIDs: number[] = []
    try {
      await ElMessageBox.confirm(t('common.confirmBatchDelete'), t('common.confirmTitle'), { type: 'warning' })
      confirmed = true
      const results = await Promise.allSettled(ids.map((id) => AiImageApi.deleteOne({ id })))
      deletedIDs = results.reduce<number[]>((list, result, index) => {
        if (result.status !== 'fulfilled') return list
        const id = ids[index]
        if (id === undefined) {
          throw new Error('AI image delete result should map to an input id')
        }
        list.push(id)
        return list
      }, [])

      clearDetailForDeletedIDs(deletedIDs)

      const failedCount = results.length - deletedIDs.length
      if (failedCount > 0) {
        throw new Error(t('aiImages.deletePartialFailed', { count: failedCount }))
      }
      ElMessage.success(t('common.success.delete'))
    } catch (error: unknown) {
      if (isCancelError(error)) return
      notifyError(error, t('aiImages.deleteFailed'))
    } finally {
      if (confirmed) {
        try {
          await refreshList()
        } catch (error: unknown) {
          notifyError(error, t('aiImages.refreshFailed'))
        }
      }
    }
  }

  function clearDetailForDeletedIDs(ids: number[]) {
    if (options.selectedTaskId.value === null) return
    if (!ids.includes(options.selectedTaskId.value)) return
    options.selectedTaskId.value = null
    options.detail.value = null
  }

  function requireNonEmptyURL(value: string, message: string): string {
    const url = value.trim()
    if (url === '') {
      throw new Error(message)
    }
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error(message)
    }
    return parsed.toString()
  }

  function imageMimeTypeFromURL(url: string): string {
    const pathname = new URL(url).pathname.toLowerCase()
    if (pathname.endsWith('.png')) return 'image/png'
    if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg'
    if (pathname.endsWith('.webp')) return 'image/webp'
    if (pathname.endsWith('.gif')) return 'image/gif'
    throw new Error(t('aiImages.assetMimeRequired'))
  }

  function readImageDimensionsFromURL(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight })
      }
      image.onerror = () => {
        reject(new Error(t('aiImages.imageDimensionsFailed')))
      }
      image.src = url
    })
  }

  function assetContent(file: AiImageFileItem) {
    if (file.revised_prompt === undefined) return ''
    return file.revised_prompt
  }

  function notifyError(error: unknown, fallback: string) {
    ElNotification.error({ message: error instanceof Error ? error.message : fallback })
  }

  function isCancelError(error: unknown) {
    return error === 'cancel' || error === 'close'
  }

  async function refreshList() {
    await options.refreshList()
  }

  return {
    canAddReference,
    referenceLimitReachedMessage,
    ensureReferenceCapacity,
    appendUploadedReference,
    addAssetReference,
    addClipboardReference,
    addReference,
    saveAsset,
    deleteSelected,
  }
}
