<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Collection, FolderOpened, Picture, Promotion, Upload } from '@element-plus/icons-vue'
import type { AiImageAgentOption, AiImageInitResponse } from '@/api/ai/images'
import ImageAssetList from '../ImageAssetList/index.vue'
import type { ImageComposerFile, ImageComposerState, UploadImageFileRequest } from '../../types'

interface Props {
  dict: AiImageInitResponse['dict']
  agentOptions: AiImageAgentOption[]
  uploading: boolean
  submitting: boolean
  canUploadFile: boolean
  canCreateTask: boolean
  referenceLimit: number
}

interface Emits {
  uploadFile: [request: UploadImageFileRequest]
  openMask: []
  openPromptLibrary: []
  openAssetLibrary: []
  addClipboardReference: []
  submit: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const form = defineModel<ImageComposerState>({ required: true })
const { t } = useI18n()

const canUploadMore = computed(() => form.value.input_files.length < props.referenceLimit)
const agentSelectOptions = computed(() => props.agentOptions.map((agent) => ({ label: agent.name, value: agent.id })))
const submitDisabled = computed(() => {
  return props.submitting || !props.canCreateTask || !form.value.agent_id || form.value.prompt.trim() === ''
})
const referenceSummary = computed(() => t('aiImages.referenceCount', { count: form.value.input_files.length, max: props.referenceLimit }))
const referenceLimitReachedTip = computed(() => t('aiImages.referenceLimitReached', { max: props.referenceLimit }))

function beforeReferenceUpload(file: File) {
  if (!props.canUploadFile || !canUploadMore.value) return false
  emit('uploadFile', { file, source_type: 'upload' })
  return false
}

function removeFile(file: ImageComposerFile) {
  form.value.input_files = normalizeSortOrder(form.value.input_files.filter((item) => item.client_id !== file.client_id))
  if (form.value.mask_file !== null) {
    clearMask()
  }
}

function clearMask() {
  form.value.mask_file = null
  form.value.mask_target_sort_order = ''
}

function normalizeSortOrder(files: ImageComposerFile[]): ImageComposerFile[] {
  return files.map((file, index) => ({ ...file, sort_order: index + 1 }))
}
</script>

<template>
  <div class="image-composer">
    <header class="composer-header">
      <div>
        <h1 class="composer-title">{{ t('aiImages.studioTitle') }}</h1>
        <p class="composer-subtitle">{{ t('aiImages.studioSubtitle') }}</p>
      </div>
      <el-button type="primary" :icon="Promotion" :loading="submitting" :disabled="submitDisabled" @click="emit('submit')">
        {{ t('aiImages.generate') }}
      </el-button>
    </header>

    <el-form label-position="top" class="composer-form">
      <section class="composer-section composer-section--prompt">
        <div class="section-heading">
          <h2>{{ t('aiImages.prompt') }}</h2>
          <div class="section-actions">
            <el-button :icon="Collection" plain @click="emit('openPromptLibrary')">
              {{ t('aiImages.promptLibrary') }}
            </el-button>
          </div>
        </div>
        <el-input
          v-model="form.prompt"
          class="studio-prompt-input"
          type="textarea"
          :autosize="{ minRows: 7, maxRows: 12 }"
          maxlength="20000"
          show-word-limit
          :placeholder="t('aiImages.promptPlaceholder')"
        />
      </section>

      <section class="composer-section composer-section--references">
        <div class="section-heading">
          <div>
            <h2>{{ t('aiImages.referenceImages') }}</h2>
            <p>{{ referenceSummary }}</p>
          </div>
          <div class="section-actions">
            <el-tooltip :disabled="canUploadMore" :content="referenceLimitReachedTip">
              <span class="composer-action-tooltip">
                <el-button :icon="FolderOpened" plain :disabled="!canUploadMore" @click="emit('openAssetLibrary')">
                  {{ t('aiImages.assetLibrary') }}
                </el-button>
              </span>
            </el-tooltip>
            <el-tooltip :disabled="canUploadMore" :content="referenceLimitReachedTip">
              <span class="composer-action-tooltip">
                <el-button :icon="Picture" plain :disabled="!canUploadMore" @click="emit('addClipboardReference')">
                  {{ t('aiImages.clipboardReference') }}
                </el-button>
              </span>
            </el-tooltip>
            <el-tooltip :disabled="canUploadMore" :content="referenceLimitReachedTip">
              <span class="composer-action-tooltip">
                <el-upload
                  multiple
                  accept="image/*"
                  :show-file-list="false"
                  :disabled="uploading || !canUploadFile || !canUploadMore"
                  :before-upload="beforeReferenceUpload"
                >
                  <el-button :icon="Upload" plain :loading="uploading" :disabled="!canUploadFile || !canUploadMore">
                    {{ t('aiImages.uploadReference') }}
                  </el-button>
                </el-upload>
              </span>
            </el-tooltip>
            <el-button plain :disabled="form.input_files.length === 0" @click="emit('openMask')">
              {{ t('aiImages.maskEdit') }}
            </el-button>
          </div>
        </div>
        <ImageAssetList
          :files="form.input_files"
          :mask-file="form.mask_file"
          :mask-target-sort-order="form.mask_target_sort_order"
          @remove="removeFile"
          @clear-mask="clearMask"
        />
      </section>

      <section class="composer-section composer-section--settings">
        <h2>{{ t('aiImages.generationSettings') }}</h2>
        <div class="settings-grid">
          <label class="studio-field studio-field--wide">
            <span>{{ t('aiImages.model') }}</span>
            <el-select-v2
              v-model="form.agent_id"
              :options="agentSelectOptions"
              :placeholder="t('aiImages.agentPlaceholder')"
              filterable
              clearable
            />
          </label>

          <label class="studio-field studio-field--wide quality-field">
            <span>{{ t('aiImages.quality') }}</span>
            <el-radio-group v-model="form.quality" class="quality-segment">
              <el-radio-button v-for="item in dict.quality_arr" :key="item.value" :label="item.value">
                {{ item.label }}
              </el-radio-button>
            </el-radio-group>
          </label>

          <label class="studio-field">
            <span>{{ t('aiImages.size') }}</span>
            <el-select-v2 v-model="form.size" :options="dict.size_arr" />
          </label>
          <label class="studio-field">
            <span>{{ t('aiImages.n') }}</span>
            <el-input-number v-model="form.n" :min="1" :max="4" :controls="false" />
          </label>
        </div>
        <el-alert v-if="agentOptions.length === 0" :title="t('aiImages.noAgentTip')" type="warning" :closable="false" />
      </section>
    </el-form>
  </div>
</template>

<style scoped>
.image-composer {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
  min-width: 0;
}

.composer-header,
.section-heading {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.composer-title {
  color: var(--image-studio-text, var(--el-text-color-primary));
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0;
}

.composer-subtitle,
.section-heading p {
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-size: 13px;
  line-height: 1.6;
  margin: 8px 0 0;
}

.composer-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.composer-section {
  border: 1px solid var(--image-studio-line, var(--el-border-color-lighter));
  border-radius: 18px;
  background: var(--image-studio-surface-soft, var(--el-fill-color-extra-light));
  padding: 16px;
}

.composer-section h2 {
  color: var(--image-studio-text, var(--el-text-color-primary));
  font-size: 16px;
  font-weight: 760;
  line-height: 1.2;
  margin: 0;
}

.section-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.composer-action-tooltip {
  display: inline-flex;
}

.studio-prompt-input {
  margin-top: 12px;
}

.studio-prompt-input :deep(.el-textarea__inner) {
  min-height: 188px !important;
  padding: 14px 16px;
  border-radius: 14px;
  line-height: 1.65;
  resize: vertical;
  background: var(--image-studio-surface, var(--el-bg-color));
}

.composer-section--references :deep(.image-asset-list) {
  margin-top: 12px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.studio-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.studio-field--wide {
  grid-column: 1 / -1;
}

.studio-field span {
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-size: 12px;
  font-weight: 700;
}

.studio-field :deep(.el-input-number),
.studio-field :deep(.el-select),
.studio-field :deep(.el-select-v2) {
  width: 100%;
}

.quality-segment {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.quality-segment :deep(.el-radio-button__inner) {
  width: 100%;
  border-radius: 999px;
  border-left: var(--el-border);
  background: var(--image-studio-surface, var(--el-bg-color));
  font-weight: 700;
}

.quality-segment :deep(.el-radio-button:first-child .el-radio-button__inner),
.quality-segment :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 999px;
}

.composer-section--settings :deep(.el-alert) {
  margin-top: 14px;
}

@media (max-width: 860px) {
  .composer-header,
  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .section-actions {
    justify-content: flex-start;
  }

  .settings-grid,
  .quality-segment {
    grid-template-columns: 1fr;
  }
}
</style>
