<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppDialog } from '@/components/AppDialog'
import type { DictOption } from '@/types/common'
import type { CineMutationParams, CineProjectItem } from '@/api/ai/cine'

const props = defineProps<{
  visible: boolean
  loading: boolean
  agentOptions: DictOption<number>[]
  project?: CineProjectItem | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [payload: CineMutationParams]
}>()

const { t } = useI18n()

const form = reactive<CineMutationParams>({
  title: '',
  source_text: '',
  style: '电影感，克制表演，连续性优先',
  duration_seconds: 30,
  aspect_ratio: '9:16',
  agent_id: undefined,
})

const dialogTitle = computed(() => props.project?.id ? t('cine.form.editTitle') : t('cine.form.createTitle'))
const submitText = computed(() => props.project?.id ? t('common.actions.confirm') : t('cine.actions.createProject'))
const hasNoAgent = computed(() => props.agentOptions.length === 0)

watch(
  () => [props.visible, props.project] as const,
  () => {
    if (!props.visible) return

    form.id = props.project?.id
    form.title = props.project?.title ?? ''
    form.source_text = props.project?.source_text ?? ''
    form.style = props.project?.style ?? '电影感，克制表演，连续性优先'
    form.duration_seconds = props.project?.duration_seconds ?? 30
    form.aspect_ratio = props.project?.aspect_ratio ?? '9:16'
    form.agent_id = props.project?.agent_id || props.agentOptions[0]?.value
  },
  { immediate: true },
)

function close() {
  emit('update:visible', false)
}

function submit() {
  emit('submit', { ...form })
}
</script>

<template>
  <AppDialog
    :model-value="visible"
    :title="dialogTitle"
    width="760px"
    :close-on-click-modal="false"
    destroy-on-close
    draggable
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="form-shell">
      <el-alert
        v-if="hasNoAgent"
        :title="t('cine.form.noAgentTitle')"
        :description="t('cine.form.noAgentDesc')"
        type="warning"
        show-icon
        :closable="false"
      />

      <el-form
        label-position="top"
        class="cine-form"
      >
        <el-form-item
          :label="t('cine.form.title')"
          required
        >
          <el-input
            v-model="form.title"
            :placeholder="t('cine.form.titlePlaceholder')"
            maxlength="120"
            show-word-limit
          />
        </el-form-item>

        <el-form-item
          :label="t('cine.form.sourceText')"
          required
        >
          <el-input
            v-model="form.source_text"
            type="textarea"
            :rows="9"
            :placeholder="t('cine.form.sourcePlaceholder')"
            maxlength="50000"
            show-word-limit
          />
        </el-form-item>

        <div class="form-grid">
          <el-form-item :label="t('cine.form.duration')">
            <el-input-number
              v-model="form.duration_seconds"
              :min="5"
              :max="300"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item :label="t('cine.form.aspectRatio')">
            <el-select
              v-model="form.aspect_ratio"
              style="width: 100%"
            >
              <el-option
                label="9:16"
                value="9:16"
              />
              <el-option
                label="16:9"
                value="16:9"
              />
              <el-option
                label="1:1"
                value="1:1"
              />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item :label="t('cine.form.agent')">
          <el-select-v2
            v-model="form.agent_id"
            :options="agentOptions"
            style="width: 100%"
            clearable
            :placeholder="t('cine.form.agentPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('cine.form.style')">
          <el-input
            v-model="form.style"
            type="textarea"
            :rows="3"
            :placeholder="t('cine.form.stylePlaceholder')"
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">
          {{ t('common.actions.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!form.title || !form.source_text"
          @click="submit"
        >
          {{ submitText }}
        </el-button>
      </div>
    </template>
  </AppDialog>
</template>

<style scoped>
.form-shell { display: flex; flex-direction: column; gap: 16px; }
.cine-form { padding-bottom: 4px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
@media (max-width: 720px) { .form-grid { grid-template-columns: 1fr; } }
</style>
