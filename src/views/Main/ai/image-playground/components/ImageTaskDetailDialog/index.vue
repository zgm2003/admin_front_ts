<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CommonEnum } from '@/enums'
import { AppDialog } from '@/components/AppDialog'
import type { AiImageAssetItem, AiImageDetailResponse } from '@/api/ai/images'
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
            <el-tag>{{ task.status_name || task.status }}</el-tag>
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
  margin-bottom: 16px;
}

.detail-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.detail-title {
  font-size: 18px;
  margin: 10px 0 4px;
}

.detail-meta,
.revised-prompt {
  color: var(--el-text-color-secondary);
  margin: 0;
}

.prompt-box {
  white-space: pre-wrap;
}

.detail-section {
  margin-top: 18px;
}

.detail-section h4 {
  margin: 0 0 12px;
}

.output-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.output-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  overflow: hidden;
}

.output-image {
  width: 100%;
  height: 240px;
  background: var(--el-fill-color-light);
  display: block;
}

.output-toolbar {
  justify-content: space-between;
  padding: 10px 12px;
}

.revised-prompt {
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  line-height: 1.5;
  padding: 10px 12px;
}
</style>
