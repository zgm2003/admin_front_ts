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
  gap: 12px;
}

.asset-empty {
  border: 1px dashed var(--el-border-color);
  border-radius: 12px;
  color: var(--el-text-color-secondary);
  padding: 18px;
  text-align: center;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  gap: 12px;
}

.asset-card,
.mask-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-bg-color);
}

.asset-thumb {
  width: 100%;
  height: 104px;
  display: block;
}

.asset-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  padding: 8px 10px 0;
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
  border-radius: 10px;
  flex: none;
}

.mask-info {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  color: var(--el-text-color-regular);
}
</style>
