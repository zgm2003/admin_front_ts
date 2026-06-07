<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { AiAssetApi, type AiAssetItem } from '@/api/ai/assets'
import type { PageInfo } from '@/types/common'
import { assetBlockedReasonKey, isImageAssetSelectable } from './asset-selectable'

interface Emits {
  selectAsset: [asset: AiAssetItem]
}

const emit = defineEmits<Emits>()
const visible = defineModel<boolean>({ required: true })
const { t } = useI18n()

const loading = shallowRef(false)
const keyword = shallowRef('')
const loadError = shallowRef('')
const assets = shallowRef<AiAssetItem[]>([])
const page = shallowRef<PageInfo>({
  current_page: 1,
  page_size: 8,
  total_page: 0,
  total: 0,
})
const emptyDescription = computed(() => (loadError.value === '' ? t('aiImages.emptyAssetLibrary') : loadError.value))

watch(visible, (nextVisible) => {
  if (!nextVisible) return
  loadAssetsSafely(1)
})

function loadAssetsSafely(currentPage: number) {
  loadError.value = ''
  void loadAssets(currentPage).catch(handleAssetLoadError)
}

async function loadAssets(currentPage: number) {
  loading.value = true
  try {
    const data = await AiAssetApi.list({
      current_page: currentPage,
      page_size: page.value.page_size,
      keyword: keyword.value,
      type: 'image',
    })
    assets.value = data.list
    page.value = data.page
  } finally {
    loading.value = false
  }
}

function searchAssets() {
  loadAssetsSafely(1)
}

function handleAssetLoadError(error: unknown) {
  assets.value = []
  page.value = emptyPage(page.value.page_size)
  loadError.value = errorMessage(error, t('aiImages.assetLoadFailed'))
  ElMessage.error(loadError.value)
}

function emptyPage(pageSize: number): PageInfo {
  return {
    current_page: 1,
    page_size: pageSize,
    total_page: 0,
    total: 0,
  }
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function isAssetSelectable(asset: AiAssetItem) {
  return isImageAssetSelectable(asset)
}

function assetBlockedReason(asset: AiAssetItem) {
  const reasonKey = assetBlockedReasonKey(asset)
  return reasonKey === null ? '' : t(reasonKey)
}

function selectAsset(asset: AiAssetItem) {
  if (!isAssetSelectable(asset)) return
  emit('selectAsset', asset)
  visible.value = false
}
</script>

<template>
  <AppDialog v-model="visible" :title="t('aiImages.assetLibrary')" width="780px" height="70vh" body-padding="20px">
    <div class="asset-picker" v-loading="loading">
      <div class="asset-search">
        <el-input v-model="keyword" :placeholder="t('aiImages.assetSearchPlaceholder')" clearable @keyup.enter="searchAssets" />
        <el-button type="primary" @click="searchAssets">{{ t('common.actions.query') }}</el-button>
      </div>

      <div class="asset-picker-grid">
        <el-empty v-if="assets.length === 0" :description="emptyDescription" />
        <template v-else>
          <el-tooltip v-for="asset in assets" :key="asset.id" :disabled="isAssetSelectable(asset)" :content="assetBlockedReason(asset)">
            <span class="asset-picker-card-shell">
              <button class="asset-picker-card" type="button" :disabled="!isAssetSelectable(asset)" @click="selectAsset(asset)">
                <el-image v-if="asset.url.trim() !== ''" class="asset-picker-image" :src="asset.url.trim()" fit="cover" />
                <div v-else class="asset-picker-missing-url">{{ t('aiImages.assetUrlMissing') }}</div>
                <div class="asset-picker-body">
                  <strong>{{ asset.title }}</strong>
                  <span>{{ asset.category }}</span>
                  <p>{{ asset.description }}</p>
                </div>
              </button>
            </span>
          </el-tooltip>
        </template>
      </div>

      <el-pagination
        small
        background
        layout="prev, pager, next"
        :page-size="page.page_size"
        :current-page="page.current_page"
        :total="page.total"
        @current-change="loadAssetsSafely"
      />
    </div>
  </AppDialog>
</template>

<style scoped>
.asset-picker {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
}

.asset-search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.asset-picker-grid {
  border: 1px dashed var(--image-studio-line-strong, var(--el-border-color));
  border-radius: 16px;
  display: grid;
  flex: 1 1 0;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  min-height: 0;
  overflow: auto;
  padding: 12px;
}

.asset-picker-card-shell {
  display: block;
  min-width: 0;
}

.asset-picker-card {
  border: 1px solid var(--image-studio-line, var(--el-border-color-lighter));
  border-radius: 14px;
  background: var(--image-studio-surface, var(--el-bg-color));
  color: inherit;
  cursor: pointer;
  min-width: 0;
  overflow: hidden;
  padding: 0;
  text-align: left;
  width: 100%;
}

.asset-picker-card:disabled {
  cursor: not-allowed;
  opacity: 0.68;
}

.asset-picker-image {
  width: 100%;
  height: 128px;
  display: block;
  background: var(--el-fill-color-light);
}

.asset-picker-missing-url {
  align-items: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  display: flex;
  font-size: 12px;
  height: 128px;
  justify-content: center;
  padding: 12px;
  text-align: center;
}

.asset-picker-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
}

.asset-picker-body strong {
  color: var(--image-studio-text, var(--el-text-color-primary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-picker-body span,
.asset-picker-body p {
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-size: 12px;
}

.asset-picker-body p {
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  display: -webkit-box;
  line-height: 1.55;
  margin: 0;
  overflow: hidden;
}
</style>
