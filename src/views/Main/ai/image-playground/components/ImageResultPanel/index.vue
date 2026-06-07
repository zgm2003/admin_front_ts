<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CommonEnum } from '@/enums'
import type { AiImageDetailResponse, AiImageFileItem, AiImageTaskStatus } from '@/api/ai/images'
import ImageAssetList from '../ImageAssetList/index.vue'

interface Props {
  detail: AiImageDetailResponse | null
  loading: boolean
  canFavorite: boolean
  canDelete: boolean
  statusOptions: { label: string; value: AiImageTaskStatus }[]
}

interface Emits {
  favorite: [taskId: number, isFavorite: number]
  delete: [taskId: number]
  reuse: [detail: AiImageDetailResponse]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const task = computed(() => props.detail?.task ?? null)
const outputFiles = computed(() => props.detail?.outputs ?? [])
const inputFiles = computed(() => props.detail?.inputs ?? [])
const maskFile = computed(() => props.detail?.mask ?? null)
const hasOutputs = computed(() => outputFiles.value.length > 0)
const maskTargetSortOrder = computed(() => {
  const mask = maskFile.value
  if (mask === null || mask === undefined) return ''
  if (mask.related_file_id === null || mask.related_file_id === undefined) {
    throw new Error('AI image mask related_file_id should not be empty')
  }
  const target = inputFiles.value.find((file) => file.id === mask.related_file_id)
  if (!target) {
    throw new Error('AI image mask related_file_id should point to an input file')
  }
  return target.sort_order
})
const nextFavoriteValue = computed(() => (task.value?.is_favorite === CommonEnum.YES ? CommonEnum.NO : CommonEnum.YES))
const favoriteText = computed(() => (task.value?.is_favorite === CommonEnum.YES ? t('aiImages.unfavorite') : t('aiImages.favorite')))
const statusLabelMap = computed(() => new Map(props.statusOptions.map((item) => [item.value, item.label])))

function statusType(value: AiImageTaskStatus) {
  if (value === 'success') return 'success'
  if (value === 'failed') return 'danger'
  if (value === 'running') return 'warning'
  return 'info'
}

function statusLabel(value: AiImageTaskStatus) {
  return statusLabelMap.value.get(value) ?? value
}

function optionalDisplay(value: string | undefined) {
  if (value === undefined || value === '') return '-'
  return value
}

function downloadFile(file: AiImageFileItem) {
  const link = document.createElement('a')
  link.href = file.storage_url
  link.download = `ai-image-${file.id}`
  link.target = '_blank'
  link.rel = 'noopener'
  link.click()
}
</script>

<template>
  <div class="result-panel" v-loading="loading">
    <header class="result-header">
      <div>
        <h2 class="result-title">{{ t('aiImages.outputs') }}</h2>
        <p class="result-subtitle">{{ t('aiImages.resultSubtitle') }}</p>
      </div>
      <el-tag v-if="task" :type="statusType(task.status)">{{ statusLabel(task.status) }}</el-tag>
    </header>

    <el-empty v-if="!detail || !task" class="result-empty" :description="t('aiImages.emptyResultPanel')" />
    <template v-else>
      <section class="result-stage">
        <div v-if="hasOutputs" class="output-grid">
          <article v-for="file in outputFiles" :key="file.id" class="output-card">
            <el-image class="output-image" :src="file.storage_url" fit="contain" :preview-src-list="outputFiles.map((item) => item.storage_url)" />
            <div class="output-toolbar">
              <span>#{{ file.id }}</span>
              <el-button type="primary" text @click="downloadFile(file)">{{ t('aiImages.download') }}</el-button>
            </div>
            <p v-if="file.revised_prompt" class="revised-prompt">{{ file.revised_prompt }}</p>
          </article>
        </div>
        <el-empty v-else class="result-empty" :description="t('aiImages.emptyOutputs')" />
      </section>

      <section class="result-detail-card">
        <div class="task-title-line">
          <strong>#{{ task.id }} · {{ task.agent_name_snapshot }}</strong>
          <span>{{ task.created_at }}</span>
        </div>
        <p class="task-prompt">{{ task.prompt }}</p>
        <div class="task-meta-grid">
          <span>{{ t('aiImages.provider') }}</span>
          <strong>{{ task.provider_name_snapshot }}</strong>
          <span>{{ t('aiImages.size') }}</span>
          <strong>{{ task.size }}</strong>
          <span>{{ t('aiImages.quality') }}</span>
          <strong>{{ task.quality }}</strong>
          <span>{{ t('aiImages.finishedAt') }}</span>
          <strong>{{ optionalDisplay(task.finished_at) }}</strong>
        </div>
        <el-text v-if="task.error_message" type="danger">{{ task.error_message }}</el-text>
      </section>

      <section class="result-actions">
        <el-button @click="emit('reuse', detail)">{{ t('aiImages.reuse') }}</el-button>
        <el-button :disabled="!canFavorite" @click="emit('favorite', task.id, nextFavoriteValue)">{{ favoriteText }}</el-button>
        <el-button type="danger" :disabled="!canDelete" @click="emit('delete', task.id)">{{ t('common.actions.del') }}</el-button>
      </section>

      <section class="result-detail-card">
        <h3>{{ t('aiImages.referenceImages') }}</h3>
        <ImageAssetList :files="inputFiles" :mask-file="maskFile" :mask-target-sort-order="maskTargetSortOrder" :removable="false" />
      </section>
    </template>
  </div>
</template>

<style scoped>
.result-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.result-header {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.result-title {
  color: var(--image-studio-text, var(--el-text-color-primary));
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin: 0;
}

.result-subtitle {
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-size: 13px;
  line-height: 1.6;
  margin: 8px 0 0;
}

.result-stage {
  border: 1px dashed var(--image-studio-line-strong, var(--el-border-color));
  border-radius: 18px;
  display: flex;
  flex: 1 1 0;
  min-height: 320px;
  min-width: 0;
  overflow: auto;
  padding: 14px;
  scrollbar-gutter: stable;
}

.result-empty {
  width: 100%;
  align-self: center;
}

.output-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  width: 100%;
}

.output-card,
.result-detail-card {
  border: 1px solid var(--image-studio-line, var(--el-border-color-lighter));
  border-radius: 16px;
  background: var(--image-studio-surface, var(--el-bg-color));
  overflow: hidden;
}

.output-image {
  width: 100%;
  height: 300px;
  display: block;
  background: var(--el-fill-color-light);
}

.output-toolbar,
.task-title-line,
.result-actions {
  align-items: center;
  display: flex;
  gap: 10px;
}

.output-toolbar,
.task-title-line {
  justify-content: space-between;
}

.output-toolbar {
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-size: 12px;
  padding: 10px 12px;
}

.revised-prompt {
  border-top: 1px solid var(--image-studio-line, var(--el-border-color-lighter));
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-size: 12px;
  line-height: 1.65;
  margin: 0;
  padding: 10px 12px;
}

.result-detail-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
}

.result-detail-card h3 {
  color: var(--image-studio-text, var(--el-text-color-primary));
  font-size: 15px;
  font-weight: 760;
  margin: 0;
}

.task-title-line strong {
  color: var(--image-studio-text, var(--el-text-color-primary));
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-title-line span {
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  flex: none;
  font-size: 12px;
}

.task-prompt {
  color: var(--image-studio-text, var(--el-text-color-primary));
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}

.task-meta-grid {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px 14px;
  font-size: 12px;
}

.task-meta-grid span {
  color: var(--image-studio-muted, var(--el-text-color-secondary));
}

.task-meta-grid strong {
  color: var(--image-studio-text, var(--el-text-color-primary));
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (max-width: 760px) {
  .result-stage {
    min-height: 220px;
  }

  .output-image {
    height: 220px;
  }
}
</style>
