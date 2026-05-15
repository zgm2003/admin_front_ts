<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AiImageAssetItem } from '@/api/ai/images'
import type { UploadAssetRequest } from '../../types'

interface Props {
  assets: AiImageAssetItem[]
  uploading: boolean
}

interface Emits {
  uploadMask: [request: UploadAssetRequest]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const visible = defineModel<boolean>({ required: true })
const { t } = useI18n()
const targetAssetId = shallowRef<number | ''>('')

watch(
  () => [visible.value, props.assets] as const,
  () => {
    if (!visible.value) return
    targetAssetId.value = props.assets[0]?.id ?? ''
  },
  { immediate: true }
)

function beforeMaskUpload(file: File) {
  if (!targetAssetId.value) return false
  emit('uploadMask', { file, source_type: 'mask', mask_target_asset_id: targetAssetId.value })
  return false
}
</script>

<template>
  <el-dialog v-model="visible" :title="t('aiImages.maskEdit')" width="720px">
    <div class="mask-dialog">
      <el-alert :title="t('aiImages.maskTip')" type="info" :closable="false" />

      <el-form label-position="top">
        <el-form-item :label="t('aiImages.maskTarget')">
          <el-select-v2
            v-model="targetAssetId"
            :options="assets.map((asset) => ({ label: `#${asset.id} ${asset.width}×${asset.height}`, value: asset.id }))"
            :placeholder="t('aiImages.maskTargetPlaceholder')"
            filterable
          />
        </el-form-item>
      </el-form>

      <div class="target-preview">
        <div v-for="asset in assets" :key="asset.id" :class="['target-card', { active: asset.id === targetAssetId }]" @click="targetAssetId = asset.id">
          <el-image class="target-image" :src="asset.storage_url" fit="cover" />
          <span>#{{ asset.id }}</span>
        </div>
      </div>

      <el-upload accept="image/*" :show-file-list="false" :disabled="uploading || !targetAssetId" :before-upload="beforeMaskUpload">
        <el-button type="primary" :loading="uploading" :disabled="!targetAssetId">
          {{ t('aiImages.uploadMask') }}
        </el-button>
      </el-upload>
    </div>
  </el-dialog>
</template>

<style scoped>
.mask-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.target-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 12px;
}

.target-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  padding: 6px;
}

.target-card.active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.target-image {
  width: 100%;
  height: 92px;
  border-radius: 8px;
  display: block;
  margin-bottom: 6px;
}
</style>
