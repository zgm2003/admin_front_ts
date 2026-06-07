<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElNotification } from 'element-plus'
import { getUploadToken, uploadFileToCloud, validateFile } from '@/lib/upload'
import { useUserStore } from '@/store/user'
import type { DictOption, PageInfo } from '@/types/common'
import type { AiPromptItem } from '@/api/ai/prompts'
import {
  AiImageApi,
  type AiImageAgentOption,
  type AiImageDetailResponse,
  type AiImageFileInput,
  type AiImageFileItem,
  type AiImageInitResponse,
  type AiImageQuality,
  type AiImageSize,
  type AiImageTaskItem,
  type AiImageTaskStatus,
} from '@/api/ai/images'
import ImageAssetPicker from './components/ImageAssetPicker/index.vue'
import ImageComposer from './components/ImageComposer/index.vue'
import ImageHistoryGrid from './components/ImageHistoryGrid/index.vue'
import ImageMaskDialog from './components/ImageMaskDialog/index.vue'
import ImagePromptDialog from './components/ImagePromptDialog/index.vue'
import ImageResultPanel from './components/ImageResultPanel/index.vue'
import { IMAGE_REFERENCE_LIMIT, useImageWorkspaceActions } from './composables/useImageWorkspaceActions'
import type { ImageComposerFile, ImageComposerMaskFile, ImageComposerState, UploadImageFileRequest } from './types'

const { t } = useI18n()
const userStore = useUserStore()

const dict = shallowRef<AiImageInitResponse['dict']>(defaultDict())
const agentOptions = shallowRef<AiImageAgentOption[]>([])
const tasks = shallowRef<AiImageTaskItem[]>([])
const detail = shallowRef<AiImageDetailResponse | null>(null)
const composer = ref<ImageComposerState>(defaultComposer())

const page = reactive<PageInfo>({
  current_page: 1,
  page_size: 12,
  total_page: 0,
  total: 0,
})

const selectedTaskId = shallowRef<number | null>(null)
const listLoading = shallowRef(false)
const initLoading = shallowRef(false)
const detailLoading = shallowRef(false)
const uploading = shallowRef(false)
const submitting = shallowRef(false)
const maskVisible = shallowRef(false)
const promptDialogVisible = shallowRef(false)
const assetPickerVisible = shallowRef(false)

const canCreateTask = computed(() => userStore.can('ai_image_task_add'))
const canUploadFile = computed(() => canCreateTask.value)
const canDelete = computed(() => userStore.can('ai_image_task_del'))
const canSaveAsset = computed(() => userStore.can('ai_asset_add'))
let draftFileSequence = 0

const {
  canAddReference,
  referenceLimitReachedMessage,
  ensureReferenceCapacity,
  appendUploadedReference,
  addAssetReference,
  addClipboardReference,
  saveAsset,
  addReference,
  deleteSelected,
} = useImageWorkspaceActions({
  composer,
  selectedTaskId,
  detail,
  createComposerFile,
  toImageFileInput,
  refreshList: loadList,
})

const localizedDict = computed<AiImageInitResponse['dict']>(() => {
  const source = dict.value
  return {
    size_arr: localizeOptions(source.size_arr, {
      auto: t('aiImages.auto'),
      '1024x1024': '1024×1024',
      '1536x1024': '1536×1024',
      '1024x1536': '1024×1536',
    }),
    quality_arr: localizeOptions(source.quality_arr, {
      auto: t('aiImages.auto'),
      low: t('aiImages.qualityLow'),
      medium: t('aiImages.qualityMedium'),
      high: t('aiImages.qualityHigh'),
    }),
    status_arr: localizeOptions(source.status_arr.length > 0 ? source.status_arr : defaultStatusOptions(), statusLabelMap()),
  }
})

async function loadInit() {
  initLoading.value = true
  try {
    const data = await AiImageApi.pageInit()
    dict.value = data.dict
    agentOptions.value = data.agent_options
    const firstAgent = data.agent_options[0]
    if (!composer.value.agent_id && firstAgent) {
      composer.value.agent_id = firstAgent.id
    }
  } finally {
    initLoading.value = false
  }
}

async function loadList() {
  listLoading.value = true
  try {
    const data = await AiImageApi.list({
      current_page: page.current_page,
      page_size: page.page_size,
    })
    tasks.value = data.list
    page.current_page = data.page.current_page
    page.page_size = data.page.page_size
    page.total = data.page.total
    page.total_page = data.page.total_page ?? 0
  } finally {
    listLoading.value = false
  }
}

async function openDetail(task: AiImageTaskItem) {
  selectedTaskId.value = task.id
  detailLoading.value = true
  try {
    detail.value = await AiImageApi.detail({ id: task.id })
  } catch (error: unknown) {
    notifyError(error, t('aiImages.detailFailed'))
  } finally {
    detailLoading.value = false
  }
}

async function uploadComposerFile(request: UploadImageFileRequest) {
  if (request.source_type === 'upload' && !ensureReferenceCapacity()) return
  uploading.value = true
  try {
    const config = await getUploadToken({
      folderName: 'ai-images',
      fileName: request.file.name,
      fileSize: request.file.size,
      fileKind: 'image',
    })
    validateFile(request.file, config, 'image')
    const [uploaded, dimensions] = await Promise.all([
      uploadFileToCloud(request.file, config),
      readImageDimensions(request.file),
    ])
    const file = createComposerFile({
      storage_provider: 'cos',
      storage_key: uploaded.key,
      storage_url: uploaded.url,
      mime_type: requireImageMimeType(request.file),
      width: dimensions.width,
      height: dimensions.height,
      size_bytes: request.file.size,
    })
    if (request.source_type === 'mask') {
      const relatedSortOrder = request.mask_target_sort_order
      if (relatedSortOrder === undefined) {
        throw new Error(t('aiImages.maskTargetRequired'))
      }
      composer.value.mask_file = { ...file, related_sort_order: relatedSortOrder }
      composer.value.mask_target_sort_order = relatedSortOrder
      maskVisible.value = false
    } else {
      const appended = appendUploadedReference(file)
      if (!appended) return
    }
    ElMessage.success(t('aiImages.uploadDone'))
  } catch (error: unknown) {
    notifyError(error, t('aiImages.uploadFailed'))
  } finally {
    uploading.value = false
  }
}

async function submitTask() {
  if (!canCreateTask.value) {
    ElMessage.warning(t('aiImages.createPermissionRequired'))
    return
  }
  const agentID = composer.value.agent_id
  if (agentID === '') {
    ElMessage.warning(t('aiImages.agentRequired'))
    return
  }
  if (composer.value.prompt.trim() === '') {
    ElMessage.warning(t('aiImages.promptRequired'))
    return
  }
  submitting.value = true
  try {
    const maskFile = composer.value.mask_file
    const created = await AiImageApi.createTask({
      agent_id: agentID,
      prompt: composer.value.prompt,
      size: composer.value.size,
      quality: composer.value.quality,
      n: composer.value.n,
      input_files: composer.value.input_files.map(toImageFileInput),
      mask_file: maskFile === null ? null : { ...toImageFileInput(maskFile), related_sort_order: maskFile.related_sort_order },
    })
    ElMessage.success(t('aiImages.taskSubmitted'))
    page.current_page = 1
    await loadList()
    await openDetail(created.task)
  } catch (error: unknown) {
    notifyError(error, t('aiImages.submitFailed'))
  } finally {
    submitting.value = false
  }
}

async function retry(source: AiImageDetailResponse) {
  if (!canCreateTask.value) {
    ElMessage.warning(t('aiImages.createPermissionRequired'))
    return
  }
  reuseTaskFields(source)
  await submitTask()
}

function reuseTaskFields(source: AiImageDetailResponse) {
  const inputFiles = source.inputs.map(toComposerFile)
  const maskFile = source.mask === null || source.mask === undefined ? null : toComposerMaskFile(source.mask, inputFiles)
  composer.value = {
    agent_id: source.task.agent_id,
    prompt: source.task.prompt,
    size: source.task.size as AiImageSize,
    quality: source.task.quality as AiImageQuality,
    n: source.task.n,
    input_files: inputFiles,
    mask_file: maskFile,
    mask_target_sort_order: maskFile === null ? '' : maskFile.related_sort_order,
  }
}

function resetComposer() {
  const next = defaultComposer()
  const firstAgent = agentOptions.value[0]
  if (firstAgent) {
    next.agent_id = firstAgent.id
  }
  composer.value = next
  detail.value = null
  selectedTaskId.value = null
}

function updatePage(next: PageInfo) {
  page.current_page = next.current_page
  void loadList()
}

function refreshList() {
  void loadList()
}

function applyPrompt(prompt: AiPromptItem) {
  composer.value.prompt = prompt.prompt
  ElMessage.success(t('aiImages.promptApplied'))
}

function defaultDict(): AiImageInitResponse['dict'] {
  return {
    size_arr: [
      { label: '1024×1024', value: '1024x1024' },
      { label: '1536×1024', value: '1536x1024' },
      { label: '1024×1536', value: '1024x1536' },
      { label: t('aiImages.auto'), value: 'auto' },
    ],
    quality_arr: [
      { label: t('aiImages.auto'), value: 'auto' },
      { label: t('aiImages.qualityLow'), value: 'low' },
      { label: t('aiImages.qualityMedium'), value: 'medium' },
      { label: t('aiImages.qualityHigh'), value: 'high' },
    ],
    status_arr: defaultStatusOptions(),
  }
}

function defaultStatusOptions(): DictOption<AiImageTaskStatus>[] {
  return (['pending', 'running', 'success', 'failed'] satisfies AiImageTaskStatus[]).map((value) => ({
    label: statusLabelMap()[value],
    value,
  }))
}

function statusLabelMap() {
  return {
    pending: t('aiImages.statusPending'),
    running: t('aiImages.statusRunning'),
    success: t('aiImages.statusSuccess'),
    failed: t('aiImages.statusFailed'),
  } satisfies Record<AiImageTaskStatus, string>
}

function localizeOptions<T extends string | number>(options: DictOption<T>[], labels: Record<string, string>): DictOption<T>[] {
  return options.map((item) => ({
    ...item,
    label: labels[String(item.value)] ?? item.label,
  }))
}

function defaultComposer(): ImageComposerState {
  return {
    agent_id: '',
    prompt: '',
    size: '1024x1024',
    quality: 'auto',
    n: 1,
    input_files: [],
    mask_file: null,
    mask_target_sort_order: '',
  }
}

function createComposerFile(input: AiImageFileInput): ImageComposerFile {
  return {
    ...input,
    client_id: `draft-${++draftFileSequence}`,
    sort_order: composer.value.input_files.length + 1,
    stored_file_id: null,
  }
}

function toComposerFile(file: AiImageFileItem): ImageComposerFile {
  return {
    storage_provider: file.storage_provider,
    storage_key: file.storage_key,
    storage_url: file.storage_url,
    mime_type: file.mime_type,
    width: file.width,
    height: file.height,
    size_bytes: file.size_bytes,
    client_id: `stored-${file.id}`,
    sort_order: file.sort_order,
    stored_file_id: file.id,
  }
}

function toComposerMaskFile(file: AiImageFileItem, inputs: ImageComposerFile[]): ImageComposerMaskFile {
  const relatedSortOrder = relatedSortOrderForMask(file, inputs)
  return {
    ...toComposerFile(file),
    related_sort_order: relatedSortOrder,
  }
}

function relatedSortOrderForMask(mask: AiImageFileItem, inputs: ImageComposerFile[]): number {
  if (mask.related_file_id === null || mask.related_file_id === undefined) {
    throw new Error('AI image mask related_file_id should not be empty')
  }
  const target = inputs.find((file) => file.stored_file_id === mask.related_file_id)
  if (!target) {
    throw new Error('AI image mask related_file_id should point to an input file')
  }
  return target.sort_order
}

function toImageFileInput(file: ImageComposerFile | AiImageFileItem): AiImageFileInput {
  return {
    storage_provider: file.storage_provider,
    storage_key: file.storage_key,
    storage_url: file.storage_url,
    mime_type: file.mime_type,
    width: file.width,
    height: file.height,
    size_bytes: file.size_bytes,
  }
}

function requireImageMimeType(file: File): string {
  const mimeType = file.type.trim()
  if (mimeType === '' || !mimeType.startsWith('image/')) {
    throw new Error(t('aiImages.imageMimeRequired'))
  }
  return mimeType
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(t('aiImages.imageDimensionsFailed')))
    }
    image.src = url
  })
}

function notifyError(error: unknown, fallback: string) {
  ElNotification.error({ message: error instanceof Error ? error.message : fallback })
}

onMounted(() => {
  Promise.all([loadInit(), loadList()]).catch((error: unknown) => {
    notifyError(error, t('aiImages.initFailed'))
  })
})
</script>

<template>
  <div class="ai-image-page" v-loading="initLoading">
    <div class="image-workspace image-workspace--three-panel">
      <section class="image-panel image-panel--records">
        <ImageHistoryGrid
          :tasks="tasks"
          :page="page"
          :loading="listLoading"
          :selected-task-id="selectedTaskId"
          :can-delete="canDelete"
          @create="resetComposer"
          @refresh="refreshList"
          @detail="openDetail"
          @page-change="updatePage"
          @delete-selected="deleteSelected"
        />
      </section>

      <section class="image-panel image-panel--composer">
        <ImageComposer
          v-model="composer"
          :dict="localizedDict"
          :agent-options="agentOptions"
          :uploading="uploading"
          :submitting="submitting"
          :can-upload-file="canUploadFile"
          :can-create-task="canCreateTask"
          :reference-limit="IMAGE_REFERENCE_LIMIT"
          @upload-file="uploadComposerFile"
          @open-mask="maskVisible = true"
          @open-prompt-library="promptDialogVisible = true"
          @open-asset-library="assetPickerVisible = true"
          @add-clipboard-reference="addClipboardReference"
          @submit="submitTask"
        />
      </section>

      <section class="image-panel image-panel--result">
        <ImageResultPanel
          :detail="detail"
          :loading="detailLoading"
          :can-save-asset="canSaveAsset"
          :can-add-reference="canAddReference"
          :can-retry="canCreateTask"
          :add-reference-disabled-reason="referenceLimitReachedMessage"
          @save-asset="saveAsset"
          @add-reference="addReference"
          @retry="retry"
        />
      </section>
    </div>

    <ImageMaskDialog
      v-model="maskVisible"
      :files="composer.input_files"
      :uploading="uploading"
      @upload-mask-file="uploadComposerFile"
    />
    <ImagePromptDialog v-model="promptDialogVisible" @select-prompt="applyPrompt" />
    <ImageAssetPicker v-model="assetPickerVisible" @select-asset="addAssetReference" />
  </div>
</template>

<style>
@media (max-width: 1360px) {
  .el-main.layout-content .layout-view.page-card:has(.ai-image-page) {
    height: auto;
    min-height: 100%;
    overflow: visible;
  }
}
</style>

<style scoped>
.ai-image-page {
  --image-studio-bg: #f6f8fc;
  --image-studio-surface: #ffffff;
  --image-studio-surface-soft: #fbfcff;
  --image-studio-line: #e5ebf3;
  --image-studio-line-strong: #d6dfeb;
  --image-studio-text: #172033;
  --image-studio-muted: #7a8495;
  --image-studio-primary-soft: color-mix(in srgb, var(--el-color-primary) 9%, transparent);
  --image-studio-shadow: 0 14px 34px rgba(20, 42, 74, 0.06);
  --image-studio-shadow-hover: 0 18px 42px rgba(20, 42, 74, 0.1);
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  color: var(--image-studio-text);
  padding: 0;
}

.image-workspace--three-panel {
  display: grid;
  grid-template-columns: minmax(280px, 0.82fr) minmax(360px, 1fr) minmax(430px, 1.45fr);
  gap: 16px;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.image-panel {
  min-height: 0;
  min-width: 0;
  overflow: auto;
  padding: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(251, 252, 255, 0.9)),
    radial-gradient(circle at 12% 0%, var(--image-studio-primary-soft), transparent 34%);
  border: 1px solid var(--image-studio-line);
  border-radius: 20px;
  box-shadow: var(--image-studio-shadow);
  scrollbar-gutter: stable;
  transition:
    border-color var(--app-motion-fast) var(--app-ease-standard),
    box-shadow var(--app-motion-fast) var(--app-ease-standard);
}

.image-panel--records,
.image-panel--result {
  height: 100%;
}

.image-panel--composer {
  height: 100%;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 252, 255, 0.94)),
    radial-gradient(circle at 50% 0%, var(--image-studio-primary-soft), transparent 34%);
}

.image-panel:hover {
  border-color: var(--image-studio-line-strong);
  box-shadow: var(--image-studio-shadow-hover);
}

.image-panel :deep(.el-input__wrapper),
.image-panel :deep(.el-select__wrapper),
.image-panel :deep(.el-textarea__inner) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px var(--image-studio-line) inset;
  transition:
    box-shadow var(--app-motion-fast) var(--app-ease-standard),
    background-color var(--app-motion-fast) var(--app-ease-standard);
}

.image-panel :deep(.el-input__wrapper.is-focus),
.image-panel :deep(.el-select__wrapper.is-focused),
.image-panel :deep(.el-textarea__inner:focus) {
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 52%, transparent) inset,
    0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.image-panel :deep(.el-button) {
  border-radius: 12px;
  font-weight: 600;
}

@media (max-width: 1360px) {
  .ai-image-page {
    height: auto;
    min-height: 100%;
    overflow: visible;
  }

  .image-workspace--three-panel {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
  }

  .image-panel {
    overflow: visible;
  }

  .image-panel--records,
  .image-panel--composer,
  .image-panel--result {
    height: auto;
  }

  .image-panel--records {
    min-height: 360px;
  }
}

@media (max-width: 640px) {
  .image-workspace--three-panel {
    gap: 12px;
  }

  .image-panel {
    padding: 14px;
    border-radius: 16px;
  }
}
</style>
