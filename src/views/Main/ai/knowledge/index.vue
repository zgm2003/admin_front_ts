<script setup lang="ts">
import { shallowRef } from 'vue'
import type { AiKnowledgeBaseItem } from '@/api/ai/knowledge'
import KnowledgeBaseList from './components/KnowledgeBaseList/index.vue'
import KnowledgeDocumentPanel from './components/KnowledgeDocumentPanel/index.vue'

const selectedBase = shallowRef<AiKnowledgeBaseItem | null>(null)
const documentRefreshSignal = shallowRef(0)

function selectBase(row: AiKnowledgeBaseItem) {
  selectedBase.value = row
  documentRefreshSignal.value += 1
}
</script>

<template>
  <div class="ai-knowledge-page">
    <KnowledgeBaseList
      v-model:selected-base="selectedBase"
      class="ai-knowledge-page__bases"
      @select="selectBase"
    />
    <KnowledgeDocumentPanel
      :knowledge-base="selectedBase"
      :refresh-signal="documentRefreshSignal"
      class="ai-knowledge-page__documents"
    />
  </div>
</template>

<style scoped>
.ai-knowledge-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(380px, 42%);
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.ai-knowledge-page__bases,
.ai-knowledge-page__documents {
  min-height: 0;
}

@media (max-width: 1024px) {
  .ai-knowledge-page {
    grid-template-columns: 1fr;
    height: auto;
  }
}
</style>
