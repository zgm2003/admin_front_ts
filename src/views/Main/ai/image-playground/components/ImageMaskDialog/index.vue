<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppDialog } from '@/components/AppDialog'
import type { ImageComposerFile, UploadImageFileRequest } from '../../types'

interface Props {
  files: ImageComposerFile[]
  uploading: boolean
}

interface Emits {
  uploadMaskFile: [request: UploadImageFileRequest]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const visible = defineModel<boolean>({ required: true })
const { t } = useI18n()
const targetSortOrder = shallowRef<number | ''>('')

watch(
  () => [visible.value, props.files] as const,
  () => {
    if (!visible.value) return
    targetSortOrder.value = props.files[0]?.sort_order ?? ''
  },
  { immediate: true }
)

function beforeMaskUpload(file: File) {
  if (!targetSortOrder.value) return false
  emit('uploadMaskFile', { file, source_type: 'mask', mask_target_sort_order: targetSortOrder.value })
  return false
}
</script>

<template>
  <AppDialog v-model="visible" :title="t('aiImages.maskEdit')" width="720px" height="66vh" body-padding="20px">
    <div class="mask-dialog">
      <el-alert :title="t('aiImages.maskTip')" type="info" :closable="false" />

      <el-form label-position="top">
        <el-form-item :label="t('aiImages.maskTarget')">
          <el-select-v2
            v-model="targetSortOrder"
            :options="files.map((file) => ({ label: `#${file.sort_order} ${file.width}×${file.height}`, value: file.sort_order }))"
            :placeholder="t('aiImages.maskTargetPlaceholder')"
            filterable
          />
        </el-form-item>
      </el-form>

      <div class="target-preview">
        <button
          v-for="file in files"
          :key="file.client_id"
          type="button"
          :class="['target-card', { active: file.sort_order === targetSortOrder }]"
          @click="targetSortOrder = file.sort_order"
        >
          <el-image class="target-image" :src="file.storage_url" fit="cover" />
          <span>#{{ file.sort_order }}</span>
        </button>
      </div>

      <el-upload accept="image/*" :show-file-list="false" :disabled="uploading || !targetSortOrder" :before-upload="beforeMaskUpload">
        <el-button type="primary" :loading="uploading" :disabled="!targetSortOrder">
          {{ t('aiImages.uploadMask') }}
        </el-button>
      </el-upload>
    </div>
  </AppDialog>
</template>

<style scoped>
.mask-dialog {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.target-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(126px, 1fr));
  gap: 14px;
}

.target-card {
  appearance: none;
  border: 1px solid var(--image-studio-line, var(--el-border-color-lighter));
  border-radius: 14px;
  background: var(--image-studio-surface, var(--el-bg-color));
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  cursor: pointer;
  overflow: hidden;
  padding: 7px;
  text-align: left;
  transition:
    border-color var(--app-motion-fast) var(--app-ease-standard),
    box-shadow var(--app-motion-fast) var(--app-ease-standard),
    transform var(--app-motion-fast) var(--app-ease-standard);
}

.target-card:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 34%, var(--image-studio-line, var(--el-border-color)));
  box-shadow: 0 12px 28px rgba(20, 42, 74, 0.08);
  transform: translateY(-1px);
}

.target-card:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}

.target-card.active {
  border-color: var(--el-color-primary);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--el-color-primary) 14%, transparent),
    0 12px 28px rgba(20, 42, 74, 0.08);
}

.target-image {
  width: 100%;
  height: 100px;
  border-radius: 10px;
  display: block;
  margin-bottom: 7px;
}
</style>
