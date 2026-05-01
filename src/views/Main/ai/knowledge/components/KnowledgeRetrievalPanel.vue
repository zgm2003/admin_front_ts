<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AiKnowledgeRetrievalChunk } from '@/api/ai/knowledge'

const retrievalQuery = defineModel<string>('retrievalQuery', { required: true })
const contextPrompt = defineModel<string>('contextPrompt', { required: true })

const props = defineProps<{
  retrievalLoading: boolean
  retrievalChunks: AiKnowledgeRetrievalChunk[]
}>()

const emit = defineEmits<{
  (e: 'run-retrieval'): void
}>()

const { t } = useI18n()
</script>

<template>
  <section class="retrieval-panel">
    <div class="retrieval-panel__query">
      <el-input
        v-model="retrievalQuery"
        type="textarea"
        :rows="3"
        :placeholder="t('aiKnowledge.retrieval.placeholder')"
      />
      <el-button type="primary" :loading="props.retrievalLoading" @click="emit('run-retrieval')">
        {{ t('aiKnowledge.retrieval.run') }}
      </el-button>
    </div>

    <div class="retrieval-panel__results">
      <el-empty
        v-if="!props.retrievalChunks.length && !contextPrompt"
        :description="t('common.noData')"
      />
      <el-card
        v-for="chunk in props.retrievalChunks"
        :key="`${chunk.document_id}-${chunk.chunk_no}`"
        shadow="never"
      >
        <template #header>
          <span>{{ chunk.document_title }} #{{ chunk.chunk_no }} · {{ chunk.score.toFixed(2) }}</span>
        </template>
        <p>{{ chunk.content }}</p>
      </el-card>
      <el-input
        v-if="contextPrompt"
        v-model="contextPrompt"
        type="textarea"
        :rows="6"
        readonly
      />
    </div>
  </section>
</template>

<style scoped>
.retrieval-panel {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
}

.retrieval-panel__query,
.retrieval-panel__results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.retrieval-panel__query {
  flex: 0 0 auto;
}

.retrieval-panel__results {
  min-height: 0;
  flex: 1 1 auto;
  overflow: auto;
}

.retrieval-panel__results p {
  margin: 0;
  white-space: pre-wrap;
}
</style>
