<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { CommonEnum } from '@/enums'
import { getUploadToken, uploadFileToCloud, validateFile } from '@/lib/upload'
import { useUserStore } from '@/store/user'
import type { PageInfo } from '@/types/common'
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
    status_arr: [],
    favorite_arr: [
      { label: t('aiImages.favorite'), value: CommonEnum.YES },
      { label: t('aiImages.unfavorite'), value: CommonEnum.NO },
    ],
  }
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
      <section class="image-panel image-panel--composer">
        <ImageComposer
          v-model="composer"
          :dict="dict"
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

      <section class="image-panel image-panel--history">
        <ImageHistoryGrid
          v-model:status="statusFilter"
          v-model:favorite="favoriteFilter"
          :tasks="tasks"
          :page="page"
          :dict="dict"
          :loading="listLoading"
          @refresh="refreshList"
          @detail="openDetail"
          @page-change="updatePage"
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
      @favorite="toggleFavorite"
      @delete="deleteTask"
      @reuse="reuseTask"
    />
  </div>
</template>

<style scoped>
.ai-image-page {
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.image-workspace {
  display: grid;
  grid-template-columns: minmax(320px, 460px) minmax(0, 1fr);
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
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
}

@media (max-width: 1180px) {
  .ai-image-page {
    overflow: auto;
  }

  .image-workspace {
    height: auto;
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .image-panel {
    overflow: visible;
  }
}
</style>
