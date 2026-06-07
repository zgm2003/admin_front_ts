<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, FolderAdd, RefreshRight, Star } from '@element-plus/icons-vue'
import type { AiImageDetailResponse, AiImageFileItem, AiImageTaskStatus } from '@/api/ai/images'

interface Props {
  detail: AiImageDetailResponse | null
  loading: boolean
  canSaveAsset: boolean
  canAddReference: boolean
  addReferenceDisabledReason: string
}

interface Emits {
  saveAsset: [file: AiImageFileItem, detail: AiImageDetailResponse]
  addReference: [file: AiImageFileItem]
  retry: [detail: AiImageDetailResponse]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const task = computed(() => props.detail?.task ?? null)
const outputFiles = computed(() => props.detail?.outputs ?? [])
const previewSources = computed(() => outputFiles.value.map((item) => item.storage_url))
const resultState = computed<AiImageTaskStatus | 'empty'>(() => task.value?.status ?? 'empty')
const durationText = computed(() => {
  const currentTask = task.value
  if (currentTask === null) return ''
  return formatDuration(currentTask.elapsed_ms)
})

function statusType(value: AiImageTaskStatus | 'empty') {
  if (value === 'success') return 'success'
  if (value === 'failed') return 'danger'
  if (value === 'running') return 'warning'
  return 'info'
}

function statusLabel(value: AiImageTaskStatus | 'empty') {
  if (value === 'pending' || value === 'running') return t('aiImages.resultPending')
  if (value === 'success') return t('aiImages.statusSuccess')
  if (value === 'failed') return t('aiImages.statusFailed')
  return t('aiImages.emptyResultPanel')
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function formatDuration(value: number) {
  if (value < 1000) return `${value} ms`
  return `${(value / 1000).toFixed(1)} s`
}

function retry() {
  const currentDetail = props.detail
  if (currentDetail === null) {
    throw new Error('AI image result detail should not be empty when retrying')
  }
  emit('retry', currentDetail)
}

function saveAsset(file: AiImageFileItem) {
  const currentDetail = props.detail
  if (currentDetail === null) {
    throw new Error('AI image result detail should not be empty when saving output')
  }
  emit('saveAsset', file, currentDetail)
}

function addReference(file: AiImageFileItem) {
  if (!props.canAddReference) return
  emit('addReference', file)
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
      <el-tag :type="statusType(resultState)">{{ statusLabel(resultState) }}</el-tag>
    </header>

    <el-empty v-if="!detail || !task" class="result-empty" :description="t('aiImages.emptyResultPanel')" />

    <section v-else-if="task.status === 'pending' || task.status === 'running'" class="result-state result-state--pending">
      <el-icon class="result-spinner"><RefreshRight /></el-icon>
      <strong>{{ t('aiImages.resultPending') }}</strong>
      <span>{{ t('aiImages.resultPendingTip') }}</span>
    </section>

    <section v-else-if="task.status === 'failed'" class="result-state result-state--failed">
      <strong>{{ t('aiImages.resultFailed') }}</strong>
      <el-text type="danger">{{ task.error_message }}</el-text>
      <el-button type="primary" :icon="RefreshRight" @click="retry">
        {{ t('aiImages.retry') }}
      </el-button>
    </section>

    <section v-else class="result-stage">
      <el-empty v-if="outputFiles.length === 0" class="result-empty" :description="t('aiImages.emptyOutputs')" />
      <div v-else class="output-grid">
        <article v-for="file in outputFiles" :key="file.id" class="output-card">
          <el-image class="output-image" :src="file.storage_url" fit="contain" :preview-src-list="previewSources" />
          <div class="output-body">
            <div class="output-meta">
              <span>{{ file.width }}×{{ file.height }}</span>
              <span>{{ formatBytes(file.size_bytes) }}</span>
              <span>{{ durationText }}</span>
            </div>
            <p v-if="file.revised_prompt" class="revised-prompt">{{ file.revised_prompt }}</p>
            <div class="output-actions">
              <el-button :icon="Star" :disabled="!canSaveAsset" @click="saveAsset(file)">
                {{ t('aiImages.addToAssets') }}
              </el-button>
              <el-tooltip :disabled="canAddReference" :content="addReferenceDisabledReason">
                <span class="output-action-tooltip">
                  <el-button :icon="FolderAdd" :disabled="!canAddReference" @click="addReference(file)">
                    {{ t('aiImages.addToReferences') }}
                  </el-button>
                </span>
              </el-tooltip>
              <el-button type="primary" :icon="Download" @click="downloadFile(file)">
                {{ t('aiImages.download') }}
              </el-button>
            </div>
          </div>
        </article>
      </div>
    </section>
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

.result-stage,
.result-state {
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

.result-state {
  align-items: center;
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.result-state strong {
  color: var(--image-studio-text, var(--el-text-color-primary));
  font-size: 18px;
  margin-top: 12px;
}

.result-state--failed {
  gap: 12px;
}

.result-spinner {
  color: var(--el-color-primary);
  font-size: 34px;
  animation: image-result-spin 1.2s linear infinite;
}

.result-empty {
  width: 100%;
  align-self: center;
}

.output-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
  width: 100%;
}

.output-card {
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

.output-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.output-meta,
.output-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.output-action-tooltip {
  display: inline-flex;
}

.output-meta {
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-size: 12px;
}

.revised-prompt {
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-size: 12px;
  line-height: 1.65;
  margin: 0;
}

@keyframes image-result-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .result-stage,
  .result-state {
    min-height: 220px;
  }

  .output-image {
    height: 220px;
  }
}
</style>
