<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Picture, Promotion } from '@element-plus/icons-vue'
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
const agentSelectOptions = computed(() => props.agentOptions.map((agent) => ({ label: agent.name, value: agent.id })))
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
  <div class="image-composer">
    <el-form label-position="top" class="composer-form">
      <div class="prompt-row">
        <el-input
          v-model="form.prompt"
          class="prompt-input"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 4 }"
          maxlength="20000"
          show-word-limit
          :placeholder="t('aiImages.promptPlaceholder')"
        />
        <div class="prompt-actions">
          <el-upload
            multiple
            accept="image/*"
            :show-file-list="false"
            :disabled="uploading || !canAddAsset || !canUploadMore"
            :before-upload="beforeReferenceUpload"
          >
            <el-button
              :icon="Picture"
              circle
              :title="t('aiImages.uploadReference')"
              :aria-label="t('aiImages.uploadReference')"
              :loading="uploading"
              :disabled="!canAddAsset || !canUploadMore"
            />
          </el-upload>
          <el-button
            type="success"
            :icon="Promotion"
            circle
            :title="t('aiImages.generate')"
            :aria-label="t('aiImages.generate')"
            :loading="submitting"
            :disabled="submitDisabled"
            @click="emit('submit')"
          />
        </div>
      </div>

      <div class="dock-controls">
        <label class="dock-field dock-field--agent">
          <span>{{ t('aiImages.agent') }}</span>
          <el-select-v2
            v-model="form.agent_id"
            :options="agentSelectOptions"
            :placeholder="t('aiImages.agentPlaceholder')"
            filterable
            clearable
          />
        </label>

        <label class="dock-field">
          <span>{{ t('aiImages.size') }}</span>
          <el-select-v2 v-model="form.size" :options="dict.size_arr" />
        </label>
        <label class="dock-field">
          <span>{{ t('aiImages.quality') }}</span>
          <el-select-v2 v-model="form.quality" :options="dict.quality_arr" />
        </label>
        <label class="dock-field">
          <span>{{ t('aiImages.outputFormat') }}</span>
          <el-select-v2 v-model="form.output_format" :options="dict.output_format_arr" />
        </label>
        <label class="dock-field">
          <span>{{ t('aiImages.outputCompression') }}</span>
          <el-input-number
            v-model="form.output_compression"
            :min="0"
            :max="100"
            :controls="false"
            :placeholder="t('aiImages.optional')"
          />
        </label>
        <label class="dock-field">
          <span>{{ t('aiImages.moderation') }}</span>
          <el-select-v2 v-model="form.moderation" :options="dict.moderation_arr" />
        </label>
        <label class="dock-field dock-field--number">
          <span>{{ t('aiImages.n') }}</span>
          <el-input-number v-model="form.n" :min="1" :max="4" :controls="false" />
        </label>

        <div class="mask-action">
          <el-button link :disabled="form.input_assets.length === 0" @click="emit('openMask')">
            {{ t('aiImages.maskEdit') }}
          </el-button>
        </div>
      </div>

      <div v-if="form.input_assets.length > 0 || form.mask_asset || agentOptions.length === 0" class="dock-bottom">
        <div v-if="form.input_assets.length > 0 || form.mask_asset" class="dock-assets">
          <div class="reference-summary">
            <strong>{{ t('aiImages.referenceImages') }}</strong>
            <span>{{ t('aiImages.referenceHint') }}</span>
          </div>
          <ImageAssetList
            :assets="form.input_assets"
            :mask="form.mask_asset"
            :mask-target-id="form.mask_target_asset_id"
            @remove="removeAsset"
            @clear-mask="clearMask"
          />
        </div>
        <el-alert v-if="agentOptions.length === 0" :title="t('aiImages.noAgentTip')" type="warning" :closable="false" />
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.image-composer {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.composer-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.prompt-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.prompt-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.prompt-actions :deep(.el-button.is-circle) {
  width: 40px;
  min-width: 40px;
  height: 40px;
  padding: 0;
}

.prompt-input :deep(.el-textarea__inner) {
  min-height: 44px !important;
  padding: 11px 14px;
  border-radius: 14px;
  line-height: 1.5;
  resize: none;
  background: rgba(255, 255, 255, 0.92);
}

.dock-controls {
  display: grid;
  grid-template-columns:
    minmax(150px, 1.35fr)
    repeat(5, minmax(96px, 1fr))
    minmax(82px, 0.72fr)
    minmax(72px, auto);
  gap: 8px;
  align-items: end;
}

.dock-field--number {
  max-width: 96px;
}

.dock-field {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.dock-field span {
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-size: 11px;
  font-weight: 650;
}

.dock-field :deep(.el-input-number),
.dock-field :deep(.el-select),
.dock-field :deep(.el-select-v2) {
  width: 100%;
}

.mask-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 32px;
  white-space: nowrap;
}

.mask-action :deep(.el-button) {
  padding-inline: 0;
}

.dock-bottom {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--image-studio-line, var(--el-border-color-lighter));
}

.dock-assets {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.reference-summary {
  width: 160px;
  flex: 0 0 160px;
  color: var(--image-studio-text, var(--el-text-color-primary));
}

.reference-summary strong,
.reference-summary span {
  display: block;
}

.reference-summary span {
  margin-top: 5px;
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-size: 12px;
  line-height: 1.5;
}

.dock-assets :deep(.image-asset-list) {
  flex: 1;
  min-width: 0;
}

.dock-assets :deep(.asset-grid) {
  grid-template-columns: repeat(auto-fill, minmax(92px, 118px));
}

.dock-assets :deep(.asset-thumb) {
  height: 78px;
}

@media (max-width: 1360px) {
  .composer-form {
    gap: 12px;
  }

  .dock-controls {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .dock-field--agent {
    grid-column: span 2;
  }

  .mask-action {
    grid-column: 1 / -1;
    min-width: 0;
    justify-content: flex-end;
  }

  .dock-field--number {
    max-width: none;
  }
}

@media (max-width: 860px) {
  .prompt-row {
    grid-template-columns: 1fr;
  }

  .prompt-actions {
    justify-content: flex-end;
  }

  .dock-controls {
    grid-template-columns: 1fr;
  }

  .dock-field--agent {
    grid-column: auto;
  }

  .dock-assets {
    align-items: stretch;
    flex-direction: column;
    min-width: 0;
  }

  .reference-summary {
    width: auto;
    flex-basis: auto;
  }
}

@media (max-width: 640px) {
  .prompt-actions {
    justify-content: flex-end;
  }
}
</style>
