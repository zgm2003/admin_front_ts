<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AiImageAgentOption, AiImageAssetItem, AiImageInitResponse } from '@/api/ai/images'
import ImageAssetList from '../ImageAssetList/index.vue'
import type { ImageComposerState, UploadAssetRequest } from '../../types'

interface Props {
  dict: AiImageInitResponse['dict']
  agentOptions: AiImageAgentOption[]
  uploading: boolean
  submitting: boolean
  canAddAsset: boolean
  canCreateTask: boolean
}

interface Emits {
  uploadAsset: [request: UploadAssetRequest]
  openMask: []
  submit: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const form = defineModel<ImageComposerState>({ required: true })
const { t } = useI18n()

const canUploadMore = computed(() => form.value.input_assets.length < 10)
const submitDisabled = computed(() => {
  return props.submitting || !props.canCreateTask || !form.value.agent_id || form.value.prompt.trim() === ''
})

function beforeReferenceUpload(file: File) {
  if (!props.canAddAsset || !canUploadMore.value) return false
  emit('uploadAsset', { file, source_type: 'upload' })
  return false
}

function removeAsset(asset: AiImageAssetItem) {
  form.value.input_assets = form.value.input_assets.filter((item) => item.id !== asset.id)
  if (form.value.mask_target_asset_id === asset.id) {
    clearMask()
  }
}

function clearMask() {
  form.value.mask_asset = null
  form.value.mask_target_asset_id = ''
}
</script>

<template>
  <el-card class="image-composer" shadow="never">
    <template #header>
      <div class="composer-header">
        <div>
          <h2 class="composer-title">{{ t('aiImages.title') }}</h2>
          <p class="composer-subtitle">{{ t('aiImages.subtitle') }}</p>
        </div>
        <el-tag type="success">gpt-image-2</el-tag>
      </div>
    </template>

    <el-form label-position="top" class="composer-form">
      <el-form-item :label="t('aiImages.agent')">
        <el-select-v2
          v-model="form.agent_id"
          :options="agentOptions.map((agent) => ({ label: agent.name, value: agent.id }))"
          :placeholder="t('aiImages.agentPlaceholder')"
          filterable
          clearable
        />
      </el-form-item>

      <el-form-item :label="t('aiImages.prompt')">
        <el-input
          v-model="form.prompt"
          type="textarea"
          :rows="7"
          maxlength="20000"
          show-word-limit
          :placeholder="t('aiImages.promptPlaceholder')"
        />
      </el-form-item>

      <div class="param-grid">
        <el-form-item :label="t('aiImages.size')">
          <el-select-v2 v-model="form.size" :options="dict.size_arr" />
        </el-form-item>
        <el-form-item :label="t('aiImages.quality')">
          <el-select-v2 v-model="form.quality" :options="dict.quality_arr" />
        </el-form-item>
        <el-form-item :label="t('aiImages.outputFormat')">
          <el-select-v2 v-model="form.output_format" :options="dict.output_format_arr" />
        </el-form-item>
        <el-form-item :label="t('aiImages.n')">
          <el-input-number v-model="form.n" :min="1" :max="4" />
        </el-form-item>
        <el-form-item :label="t('aiImages.moderation')">
          <el-select-v2 v-model="form.moderation" :options="dict.moderation_arr" />
        </el-form-item>
        <el-form-item :label="t('aiImages.outputCompression')">
          <el-input-number v-model="form.output_compression" :min="0" :max="100" :placeholder="t('aiImages.optional')" />
        </el-form-item>
      </div>

      <div class="reference-toolbar">
        <div>
          <strong>{{ t('aiImages.referenceImages') }}</strong>
          <span class="reference-hint">{{ t('aiImages.referenceHint') }}</span>
        </div>
        <div class="reference-actions">
          <el-upload
            multiple
            accept="image/*"
            :show-file-list="false"
            :disabled="uploading || !canAddAsset || !canUploadMore"
            :before-upload="beforeReferenceUpload"
          >
            <el-button type="primary" :loading="uploading" :disabled="!canAddAsset || !canUploadMore">
              {{ t('aiImages.uploadReference') }}
            </el-button>
          </el-upload>
          <el-button :disabled="form.input_assets.length === 0" @click="emit('openMask')">
            {{ t('aiImages.maskEdit') }}
          </el-button>
        </div>
      </div>

      <ImageAssetList
        :assets="form.input_assets"
        :mask="form.mask_asset"
        :mask-target-id="form.mask_target_asset_id"
        @remove="removeAsset"
        @clear-mask="clearMask"
      />

      <div class="composer-actions">
        <el-alert v-if="agentOptions.length === 0" :title="t('aiImages.noAgentTip')" type="warning" :closable="false" />
        <el-button type="success" size="large" :loading="submitting" :disabled="submitDisabled" @click="emit('submit')">
          {{ t('aiImages.generate') }}
        </el-button>
      </div>
    </el-form>
  </el-card>
</template>

<style scoped>
.image-composer {
  min-width: 0;
}

.composer-header {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.composer-title {
  font-size: 20px;
  line-height: 1.2;
  margin: 0;
}

.composer-subtitle {
  color: var(--el-text-color-secondary);
  margin: 8px 0 0;
}

.composer-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.reference-toolbar {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
}

.reference-hint {
  color: var(--el-text-color-secondary);
  display: block;
  font-size: 12px;
  margin-top: 4px;
}

.reference-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.composer-actions {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}

@media (max-width: 960px) {
  .param-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .param-grid,
  .reference-toolbar,
  .composer-actions {
    grid-template-columns: 1fr;
  }

  .reference-toolbar,
  .composer-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
