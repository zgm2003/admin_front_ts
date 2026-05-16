<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { CommonEnum } from '@/enums'
import { getUploadToken, uploadFileToCloud, validateFile } from '@/lib/upload'
import { useUserStore } from '@/store/user'
import type { DictOption, PageInfo } from '@/types/common'
import {
  AiImageApi,
  type AiImageAgentOption,
  type AiImageDetailResponse,
  type AiImageInitResponse,
  type AiImageModeration,
  type AiImageOutputFormat,
  type AiImageQuality,
  type AiImageSize,
  type AiImageTaskItem,
  type AiImageTaskStatus,
} from '@/api/ai/images'
import ImageComposer from './components/ImageComposer/index.vue'
import ImageHistoryGrid from './components/ImageHistoryGrid/index.vue'
import ImageMaskDialog from './components/ImageMaskDialog/index.vue'
import ImageTaskDetailDialog from './components/ImageTaskDetailDialog/index.vue'
import type { ImageComposerState, UploadAssetRequest } from './types'

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

const statusFilter = shallowRef<AiImageTaskStatus | ''>('')
const favoriteFilter = shallowRef<number | ''>('')
const listLoading = shallowRef(false)
const initLoading = shallowRef(false)
const detailLoading = shallowRef(false)
const uploading = shallowRef(false)
const submitting = shallowRef(false)
const detailVisible = shallowRef(false)
const maskVisible = shallowRef(false)

const canAddAsset = computed(() => userStore.can('ai_image_asset_add'))
const canCreateTask = computed(() => userStore.can('ai_image_task_add'))
const canFavorite = computed(() => userStore.can('ai_image_task_favorite'))
const canDelete = computed(() => userStore.can('ai_image_task_del'))

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
    output_format_arr: localizeOptions(source.output_format_arr, {
      png: 'PNG',
      jpeg: 'JPEG',
      webp: 'WebP',
    }),
    moderation_arr: localizeOptions(source.moderation_arr, {
      auto: t('aiImages.auto'),
      low: t('aiImages.moderationLow'),
    }),
    status_arr: localizeOptions(source.status_arr.length > 0 ? source.status_arr : defaultStatusOptions(), statusLabelMap()),
    favorite_arr: [
      { label: t('aiImages.favorite'), value: CommonEnum.YES },
      { label: t('aiImages.unfavorite'), value: CommonEnum.NO },
    ],
  }
})

async function loadInit() {
  initLoading.value = true
  try {
    const data = await AiImageApi.init()
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
      status: statusFilter.value,
      is_favorite: favoriteFilter.value,
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
  detailVisible.value = true
  detailLoading.value = true
  try {
    detail.value = await AiImageApi.detail({ id: task.id })
  } catch (error: unknown) {
    notifyError(error, t('aiImages.detailFailed'))
  } finally {
    detailLoading.value = false
  }
}

async function uploadAsset(request: UploadAssetRequest) {
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
    const asset = await AiImageApi.addAsset({
      storage_provider: 'cos',
      storage_key: uploaded.key,
      storage_url: uploaded.url,
      mime_type: request.file.type || 'image/png',
      width: dimensions.width,
      height: dimensions.height,
      size_bytes: request.file.size,
      source_type: request.source_type,
    })
    if (request.source_type === 'mask') {
      composer.value.mask_asset = asset
      composer.value.mask_target_asset_id = request.mask_target_asset_id ?? ''
      maskVisible.value = false
    } else {
      composer.value.input_assets = [...composer.value.input_assets, asset]
    }
    ElMessage.success(t('aiImages.uploadDone'))
  } catch (error: unknown) {
    notifyError(error, t('aiImages.uploadFailed'))
  } finally {
    uploading.value = false
  }
}

async function submitTask() {
  if (!composer.value.agent_id) {
    ElMessage.warning(t('aiImages.agentRequired'))
    return
  }
  if (composer.value.prompt.trim() === '') {
    ElMessage.warning(t('aiImages.promptRequired'))
    return
  }
  submitting.value = true
  try {
    await AiImageApi.addTask({
      agent_id: composer.value.agent_id,
      prompt: composer.value.prompt,
      size: composer.value.size,
      quality: composer.value.quality,
      output_format: composer.value.output_format,
      output_compression: composer.value.output_compression,
      moderation: composer.value.moderation,
      n: composer.value.n,
      input_asset_ids: composer.value.input_assets.map((asset) => asset.id),
      mask_asset_id: composer.value.mask_asset?.id,
      mask_target_asset_id: composer.value.mask_target_asset_id || undefined,
    })
    ElMessage.success(t('aiImages.taskSubmitted'))
    page.current_page = 1
    await loadList()
  } catch (error: unknown) {
    notifyError(error, t('aiImages.submitFailed'))
  } finally {
    submitting.value = false
  }
}

async function toggleFavorite(taskId: number, isFavorite: number) {
  try {
    const updated = await AiImageApi.favorite({ id: taskId, is_favorite: isFavorite })
    const currentDetail = detail.value
    if (currentDetail && currentDetail.task.id === updated.id) {
      detail.value = { ...currentDetail, task: updated }
    }
    await loadList()
  } catch (error: unknown) {
    notifyError(error, t('aiImages.favoriteFailed'))
  }
}

async function deleteTask(taskId: number) {
  try {
    await ElMessageBox.confirm(t('aiImages.confirmDelete'), t('common.confirmTitle'), { type: 'warning' })
    await AiImageApi.del({ id: taskId })
    detailVisible.value = false
    detail.value = null
    await loadList()
    ElMessage.success(t('common.success.delete'))
  } catch (error: unknown) {
    if (isCancelError(error)) return
    notifyError(error, t('aiImages.deleteFailed'))
  }
}

function reuseTask(source: AiImageDetailResponse) {
  composer.value = {
    agent_id: source.task.agent_id,
    prompt: source.task.prompt,
    size: source.task.size as AiImageSize,
    quality: source.task.quality as AiImageQuality,
    output_format: source.task.output_format as AiImageOutputFormat,
    output_compression: source.task.output_compression ?? null,
    moderation: source.task.moderation as AiImageModeration,
    n: source.task.n,
    input_assets: source.inputs,
    mask_asset: source.mask ?? null,
    mask_target_asset_id: source.mask?.related_asset_id ?? '',
  }
  detailVisible.value = false
  ElMessage.success(t('aiImages.reuseDone'))
}

function updatePage(next: PageInfo) {
  page.current_page = next.current_page
  void loadList()
}

function refreshList() {
  void loadList()
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
    output_format_arr: [
      { label: 'PNG', value: 'png' },
      { label: 'JPEG', value: 'jpeg' },
      { label: 'WebP', value: 'webp' },
    ],
    moderation_arr: [
      { label: t('aiImages.auto'), value: 'auto' },
      { label: t('aiImages.moderationLow'), value: 'low' },
    ],
    status_arr: defaultStatusOptions(),
    favorite_arr: [
      { label: t('aiImages.favorite'), value: CommonEnum.YES },
      { label: t('aiImages.unfavorite'), value: CommonEnum.NO },
    ],
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
    output_format: 'png',
    output_compression: null,
    moderation: 'auto',
    n: 1,
    input_assets: [],
    mask_asset: null,
    mask_target_asset_id: '',
  }
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ width: 0, height: 0 })
    }
    image.src = url
  })
}

function notifyError(error: unknown, fallback: string) {
  ElNotification.error({ message: error instanceof Error ? error.message : fallback })
}

function isCancelError(error: unknown) {
  return error === 'cancel' || error === 'close'
}

watch([statusFilter, favoriteFilter], () => {
  page.current_page = 1
  void loadList()
})

onMounted(() => {
  Promise.all([loadInit(), loadList()]).catch((error: unknown) => {
    notifyError(error, t('aiImages.initFailed'))
  })
})
</script>

<template>
  <div class="ai-image-page" v-loading="initLoading">
    <div class="image-workspace">
      <section class="image-panel image-panel--history">
        <ImageHistoryGrid
          v-model:status="statusFilter"
          v-model:favorite="favoriteFilter"
          :tasks="tasks"
          :page="page"
          :dict="localizedDict"
          :loading="listLoading"
          @refresh="refreshList"
          @detail="openDetail"
          @page-change="updatePage"
        />
      </section>

      <section class="image-panel image-panel--composer">
        <ImageComposer
          v-model="composer"
          :dict="localizedDict"
          :agent-options="agentOptions"
          :uploading="uploading"
          :submitting="submitting"
          :can-add-asset="canAddAsset"
          :can-create-task="canCreateTask"
          @upload-asset="uploadAsset"
          @open-mask="maskVisible = true"
          @submit="submitTask"
        />
      </section>
    </div>

    <ImageMaskDialog
      v-model="maskVisible"
      :assets="composer.input_assets"
      :uploading="uploading"
      @upload-mask="uploadAsset"
    />

    <ImageTaskDetailDialog
      v-model="detailVisible"
      :detail="detail"
      :loading="detailLoading"
      :can-favorite="canFavorite"
      :can-delete="canDelete"
      :status-options="localizedDict.status_arr"
      @favorite="toggleFavorite"
      @delete="deleteTask"
      @reuse="reuseTask"
    />
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
  --image-studio-bg: #f7f9fc;
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

.image-workspace {
  display: flex;
  flex-direction: column;
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
  padding: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(251, 252, 255, 0.9)),
    radial-gradient(circle at 10% 0%, var(--image-studio-primary-soft), transparent 32%);
  border: 1px solid var(--image-studio-line);
  border-radius: 20px;
  box-shadow: var(--image-studio-shadow);
  scrollbar-gutter: stable;
  transition:
    border-color var(--app-motion-fast) var(--app-ease-standard),
    box-shadow var(--app-motion-fast) var(--app-ease-standard);
}

.image-panel--history {
  flex: 1 1 0;
  min-height: 360px;
}

.image-panel--composer {
  flex: 0 0 auto;
  max-height: min(260px, 34vh);
  overflow: auto;
  padding: 14px 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 252, 255, 0.94)),
    radial-gradient(circle at 50% 0%, var(--image-studio-primary-soft), transparent 34%);
}

.image-panel:hover {
  border-color: var(--image-studio-line-strong);
  box-shadow: var(--image-studio-shadow-hover);
}

.image-panel :deep(.el-form-item) {
  margin-bottom: 18px;
}

.image-panel :deep(.el-form-item__label) {
  padding-bottom: 8px;
  color: var(--image-studio-text);
  font-weight: 650;
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

  .image-workspace {
    height: auto;
    overflow: visible;
  }

  .image-panel {
    overflow: visible;
  }

  .image-panel--history,
  .image-panel--composer {
    flex: none;
  }

  .image-panel--history {
    order: 2;
    min-height: 0;
  }

  .image-panel--composer {
    order: 1;
    max-height: none;
    padding: 18px 20px;
  }
}

@media (max-width: 640px) {
  .image-workspace {
    gap: 12px;
  }

  .image-panel {
    padding: 14px;
    border-radius: 16px;
  }
}
</style>
