<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import {
  uploadAiContextDocument,
  type AiContextDocumentVersionCreateBody,
} from '@/api/ai/context'

const props = defineProps<{ createDocument: boolean }>()
const visible = defineModel<boolean>({ required: true })
const emit = defineEmits<{ submit: [payload: { title?: string; body: AiContextDocumentVersionCreateBody }] }>()
const { t } = useI18n()
const title = shallowRef('')
const file = shallowRef<File | null>(null)
const uploading = shallowRef(false)

watch(visible, open => {
  if (!open) return
  title.value = ''
  file.value = null
})

function selectFile(uploadFile: { raw?: File }) {
  if (!uploadFile.raw) throw new Error('Context document file is missing')
  file.value = uploadFile.raw
}

async function submit() {
  if (!file.value || (props.createDocument && !title.value.trim())) return
  uploading.value = true
  try {
    const body = await uploadAiContextDocument(file.value)
    emit('submit', { title: props.createDocument ? title.value.trim() : undefined, body })
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="createDocument ? t('aiContext.document.create') : t('aiContext.version.create')"
    width="520px"
    :close-on-click-modal="!uploading"
  >
    <el-form label-position="top">
      <el-form-item
        v-if="createDocument"
        :label="t('aiContext.fields.title')"
        required
      >
        <el-input
          v-model="title"
          maxlength="160"
        />
      </el-form-item>
      <el-form-item
        :label="t('aiContext.document.sourceFile')"
        required
      >
        <el-upload
          drag
          :auto-upload="false"
          :limit="1"
          :on-change="selectFile"
          :on-remove="() => file = null"
        >
          <el-icon class="el-icon--upload">
            <UploadFilled />
          </el-icon>
          <div>{{ t('aiContext.document.dropFile') }}</div>
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button
        :disabled="uploading"
        @click="visible = false"
      >
        {{ t('common.actions.cancel') }}
      </el-button><el-button
        type="primary"
        :loading="uploading"
        :disabled="!file || (createDocument && !title.trim())"
        @click="submit"
      >
        {{ t('common.actions.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>:deep(.el-upload), :deep(.el-upload-dragger) { width: 100%; }</style>
