<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CommonEnum } from '@/enums'
import { AppDialog } from '@/components/AppDialog'
import type { AiImageAssetItem, AiImageDetailResponse, AiImageTaskStatus } from '@/api/ai/images'
import ImageAssetList from '../ImageAssetList/index.vue'

interface Props {
  detail: AiImageDetailResponse | null
  loading: boolean
  canFavorite: boolean
  canDelete: boolean
}

interface Emits {
  favorite: [taskId: number, isFavorite: number]
  delete: [taskId: number]
  reuse: [detail: AiImageDetailResponse]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const visible = defineModel<boolean>({ required: true })
const { t } = useI18n()

const task = computed(() => props.detail?.task ?? null)
const outputAssets = computed(() => props.detail?.outputs ?? [])
const inputAssets = computed(() => props.detail?.inputs ?? [])
const maskAsset = computed(() => props.detail?.mask ?? null)
const maskTargetId = computed(() => props.detail?.mask?.related_asset_id ?? '')
const nextFavoriteValue = computed(() => (task.value?.is_favorite === CommonEnum.YES ? CommonEnum.NO : CommonEnum.YES))
const favoriteText = computed(() => (task.value?.is_favorite === CommonEnum.YES ? t('aiImages.unfavorite') : t('aiImages.favorite')))

function statusType(value: AiImageTaskStatus) {
  if (value === 'success') return 'success'
  if (value === 'failed') return 'danger'
  if (value === 'running') return 'warning'
  return 'info'
}

function downloadAsset(asset: AiImageAssetItem) {
  const link = document.createElement('a')
  link.href = asset.storage_url
  link.download = `ai-image-${asset.id}`
  link.target = '_blank'
  link.rel = 'noopener'
  link.click()
}
</script>

<template>
  <AppDialog
    v-model="visible"
    :width="'980px'"
    :height="'72vh'"
    :body-padding="'20px'"
  >
    <template #header>
      {{ t('aiImages.detail') }}
    </template>
    <div v-loading="loading" class="detail-dialog">
      <el-empty v-if="!detail || !task" :description="t('aiImages.emptyDetail')" />
      <template v-else>
        <div class="detail-header">
          <div>
            <el-tag :type="statusType(task.status)">{{ task.status_name || task.status }}</el-tag>
            <h3 class="detail-title">#{{ task.id }} · {{ task.agent_name_snapshot }}</h3>
            <p class="detail-meta">{{ task.model_id_snapshot }} · {{ task.size }} · {{ task.quality }} · {{ task.n }}</p>
          </div>
          <div class="detail-actions">
            <el-button @click="emit('reuse', detail)">{{ t('aiImages.reuse') }}</el-button>
            <el-button :disabled="!canFavorite" @click="emit('favorite', task.id, nextFavoriteValue)">{{ favoriteText }}</el-button>
            <el-button type="danger" :disabled="!canDelete" @click="emit('delete', task.id)">{{ t('common.actions.del') }}</el-button>
          </div>
        </div>

        <el-descriptions :column="2" border>
          <el-descriptions-item :label="t('aiImages.provider')">{{ task.provider_name_snapshot }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiImages.elapsed')">{{ task.elapsed_ms }}ms</el-descriptions-item>
          <el-descriptions-item :label="t('aiImages.createdAt')">{{ task.created_at }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiImages.finishedAt')">{{ task.finished_at || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="task.error_message" :label="t('aiImages.error')" :span="2">
            <el-text type="danger">{{ task.error_message }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiImages.prompt')" :span="2">
            <div class="prompt-box">{{ task.prompt }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <section class="detail-section">
          <h4>{{ t('aiImages.outputs') }}</h4>
          <el-empty v-if="outputAssets.length === 0" :description="t('aiImages.emptyOutputs')" />
          <div v-else class="output-grid">
            <div v-for="asset in outputAssets" :key="asset.id" class="output-card">
              <el-image class="output-image" :src="asset.storage_url" fit="contain" :preview-src-list="outputAssets.map((item) => item.storage_url)" />
              <div class="output-toolbar">
                <span>#{{ asset.id }}</span>
                <el-button type="primary" text @click="downloadAsset(asset)">{{ t('aiImages.download') }}</el-button>
              </div>
              <p v-if="asset.revised_prompt" class="revised-prompt">{{ asset.revised_prompt }}</p>
            </div>
          </div>
        </section>

        <section class="detail-section">
          <h4>{{ t('aiImages.referenceImages') }}</h4>
          <ImageAssetList :assets="inputAssets" :mask="maskAsset" :mask-target-id="maskTargetId" :removable="false" />
        </section>
      </template>
    </div>
  </AppDialog>
</template>

<style scoped>
.detail-dialog {
  min-height: 260px;
}

.detail-header,
.detail-actions,
.output-toolbar {
  align-items: center;
  display: flex;
  gap: 12px;
}

.detail-header {
  justify-content: space-between;
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--image-studio-line, var(--el-border-color-lighter));
}

.detail-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.detail-title {
  color: var(--image-studio-text, var(--el-text-color-primary));
  font-size: 22px;
  font-weight: 750;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin: 10px 0 5px;
}

.detail-meta,
.revised-prompt {
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  margin: 0;
}

.prompt-box {
  color: var(--image-studio-text, var(--el-text-color-primary));
  line-height: 1.7;
  white-space: pre-wrap;
}

.detail-section {
  margin-top: 22px;
}

.detail-section h4 {
  color: var(--image-studio-text, var(--el-text-color-primary));
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 12px;
}

.output-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.output-card {
  border: 1px solid var(--image-studio-line, var(--el-border-color-lighter));
  border-radius: 16px;
  overflow: hidden;
  background: var(--image-studio-surface, var(--el-bg-color));
  transition:
    border-color var(--app-motion-fast) var(--app-ease-standard),
    box-shadow var(--app-motion-fast) var(--app-ease-standard);
}

.output-card:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 34%, var(--image-studio-line, var(--el-border-color)));
  box-shadow: 0 14px 32px rgba(20, 42, 74, 0.08);
}

.output-image {
  width: 100%;
  height: 270px;
  background: var(--el-fill-color-light);
  display: block;
}

.output-toolbar {
  justify-content: space-between;
  padding: 11px 14px;
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-size: 12px;
}

.revised-prompt {
  border-top: 1px solid var(--image-studio-line, var(--el-border-color-lighter));
  font-size: 12px;
  line-height: 1.65;
  padding: 11px 14px;
}

:deep(.el-descriptions) {
  overflow: hidden;
  border-radius: 14px;
}

:deep(.el-descriptions__label.el-descriptions__cell.is-bordered-label) {
  background: var(--image-studio-surface-soft, var(--el-fill-color-extra-light));
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-weight: 650;
}

@media (max-width: 720px) {
  .detail-header {
    align-items: stretch;
    flex-direction: column;
  }

  .detail-actions {
    justify-content: flex-start;
  }
}
</style>
