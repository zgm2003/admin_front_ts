<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppTable } from '@/components/Table'
import type { PageInfo } from '@/types/common'
import type { AiKnowledgeChunkItem } from '@/api/ai/knowledge'

const props = defineProps<{
  chunks: AiKnowledgeChunkItem[]
  chunkLoading: boolean
  chunkPage: PageInfo
}>()

const emit = defineEmits<{
  (e: 'show-all-chunks'): void
  (e: 'load-chunks', documentId?: number, page?: PageInfo): void
}>()

const { t } = useI18n()

const chunkColumns = computed(() => [
  { key: 'chunk_no', label: t('aiKnowledge.chunk.no'), width: 90 },
  { key: 'content', label: t('aiKnowledge.chunk.content'), minWidth: 360, overflowTooltip: true },
  { key: 'token_estimate', label: t('aiKnowledge.chunk.tokens'), width: 100 },
  { key: 'created_at', label: t('common.createdAt'), width: 160 },
])
</script>

<template>
  <section class="chunk-panel">
    <AppTable
      :columns="chunkColumns"
      :data="props.chunks"
      :loading="props.chunkLoading"
      row-key="id"
      :pagination="props.chunkPage"
      :show-index="true"
      @refresh="emit('load-chunks')"
      @update:pagination="(page: PageInfo) => emit('load-chunks', undefined, page)"
    >
      <template #toolbar-left>
        <el-button @click="emit('show-all-chunks')">
          {{ t('aiKnowledge.chunk.showAll') }}
        </el-button>
      </template>
    </AppTable>
  </section>
</template>

<style scoped>
.chunk-panel {
  height: 100%;
  min-height: 0;
}
</style>
