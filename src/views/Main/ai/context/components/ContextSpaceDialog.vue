<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AiContextSpace, AiContextSpaceMutationBody } from '@/api/ai/context'

const props = defineProps<{ profileId: number; space: AiContextSpace | null }>()
const visible = defineModel<boolean>({ required: true })
const emit = defineEmits<{ submit: [body: AiContextSpaceMutationBody] }>()
const { t } = useI18n()
const form = reactive<AiContextSpaceMutationBody>({ name: '', description: '', profile_id: props.profileId, status: 'enabled' })

watch(visible, open => {
  if (!open) return
  form.name = props.space?.name ?? ''
  form.description = props.space?.description ?? ''
  form.profile_id = props.profileId
  form.status = props.space?.status ?? 'enabled'
})

function submit() {
  const name = form.name.trim()
  if (name) emit('submit', { ...form, name })
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="space ? t('aiContext.space.edit') : t('aiContext.space.create')"
    width="480px"
  >
    <el-form label-position="top">
      <el-form-item
        :label="t('aiContext.fields.name')"
        required
      >
        <el-input
          v-model="form.name"
          maxlength="100"
        />
      </el-form-item>
      <el-form-item :label="t('aiContext.fields.description')">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          maxlength="500"
        />
      </el-form-item>
      <el-form-item :label="t('aiContext.fields.status')">
        <el-select v-model="form.status">
          <el-option
            value="enabled"
            :label="t('aiContext.status.enabled')"
          /><el-option
            value="disabled"
            :label="t('aiContext.status.disabled')"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">
        {{ t('common.actions.cancel') }}
      </el-button><el-button
        type="primary"
        :disabled="!form.name.trim()"
        @click="submit"
      >
        {{ t('common.actions.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>:deep(.el-select) { width: 100%; }</style>
