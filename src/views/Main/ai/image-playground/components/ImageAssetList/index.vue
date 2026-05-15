<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AiImageAssetItem } from '@/api/ai/images'

interface Props {
  assets: AiImageAssetItem[]
  mask: AiImageAssetItem | null
  maskTargetId: number | ''
  removable?: boolean
}

interface Emits {
  remove: [asset: AiImageAssetItem]
  clearMask: []
}

const props = withDefaults(defineProps<Props>(), {
  removable: true,
})
const emit = defineEmits<Emits>()
const { t } = useI18n()

const maskTargetName = computed(() => {
  if (!props.mask || !props.maskTargetId) return ''
  const target = props.assets.find((asset) => asset.id === props.maskTargetId)
  return target ? `#${target.id}` : ''
})
</script>

<template>
  <div class="image-asset-list">
    <div v-if="assets.length === 0" class="asset-empty">
      {{ t('aiImages.emptyAssets') }}
    </div>
    <div v-else class="asset-grid">
      <div v-for="asset in assets" :key="asset.id" class="asset-card">
        <el-image class="asset-thumb" :src="asset.storage_url" fit="cover" :preview-src-list="[asset.storage_url]" />
        <div class="asset-meta">
          <span>#{{ asset.id }}</span>
          <span>{{ asset.width }}×{{ asset.height }}</span>
        </div>
        <el-button v-if="removable" type="danger" text size="small" @click="emit('remove', asset)">
          {{ t('common.actions.del') }}
        </el-button>
      </div>
    </div>

    <div v-if="mask" class="mask-card">
      <el-image class="mask-thumb" :src="mask.storage_url" fit="cover" :preview-src-list="[mask.storage_url]" />
      <div class="mask-info">
        <strong>{{ t('aiImages.mask') }}</strong>
        <span>{{ t('aiImages.maskTarget') }} {{ maskTargetName || '-' }}</span>
      </div>
      <el-button v-if="removable" type="danger" text size="small" @click="emit('clearMask')">
        {{ t('aiImages.clearMask') }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.image-asset-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.asset-empty {
  border: 1px dashed var(--image-studio-line-strong, var(--el-border-color));
  border-radius: 14px;
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  padding: 22px;
  text-align: center;
  background: var(--image-studio-surface-soft, var(--el-fill-color-extra-light));
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.asset-card,
.mask-card {
  border: 1px solid var(--image-studio-line, var(--el-border-color-lighter));
  border-radius: 14px;
  overflow: hidden;
  background: var(--image-studio-surface, var(--el-bg-color));
  transition:
    border-color var(--app-motion-fast) var(--app-ease-standard),
    box-shadow var(--app-motion-fast) var(--app-ease-standard),
    transform var(--app-motion-fast) var(--app-ease-standard);
}

.asset-card:hover,
.mask-card:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 34%, var(--image-studio-line, var(--el-border-color)));
  box-shadow: 0 12px 28px rgba(20, 42, 74, 0.08);
  transform: translateY(-1px);
}

.asset-thumb {
  width: 100%;
  height: 112px;
  display: block;
  background: var(--el-fill-color-light);
}

.asset-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-size: 12px;
  padding: 9px 10px 0;
}

.mask-card {
  align-items: center;
  display: flex;
  gap: 12px;
  padding: 10px;
}

.mask-thumb {
  width: 76px;
  height: 76px;
  border-radius: 12px;
  flex: none;
}

.mask-info {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  color: var(--image-studio-text, var(--el-text-color-regular));
}
</style>
