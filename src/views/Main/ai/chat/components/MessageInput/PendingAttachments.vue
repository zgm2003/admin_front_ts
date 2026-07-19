<script setup lang="ts">
import { Close, Loading } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { PendingAttachment } from './use-image-attachments'

defineProps<{ attachments: readonly PendingAttachment[] }>()
const emit = defineEmits<{ remove: [id: string] }>()
const { t } = useI18n()
</script>

<template>
  <div class="pending-area">
    <div
      v-for="attachment in attachments"
      :key="attachment.id"
      class="pending-item"
      :class="{ error: attachment.status === 'error' }"
    >
      <img
        :src="attachment.preview"
        :alt="attachment.file.name"
        class="pending-thumb"
      >
      <div
        v-if="attachment.status === 'uploading'"
        class="pending-overlay"
      >
        <el-icon
          class="is-loading"
          :size="20"
          color="#fff"
        >
          <Loading />
        </el-icon>
      </div>
      <div
        v-if="attachment.status === 'error'"
        class="pending-overlay error"
      >
        <span class="error-text">{{ attachment.error || t('aiChat.uploadFailed') }}</span>
      </div>
      <button
        class="pending-remove"
        @click="emit('remove', attachment.id)"
      >
        <el-icon :size="12">
          <Close />
        </el-icon>
      </button>
    </div>
  </div>
</template>

<style scoped src="./pending-attachments.css"></style>
