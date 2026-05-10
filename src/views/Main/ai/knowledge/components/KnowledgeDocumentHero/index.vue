<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CommonEnum } from '@/enums'
import type { AiKnowledgeBaseItem } from '@/api/ai/knowledge'

interface Props {
  knowledgeBase: AiKnowledgeBaseItem | null
}

interface Emits {
  add: []
  'retrieval-test': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const selectedBaseName = computed(
  () => props.knowledgeBase?.name ?? t('aiKnowledge.document.selectBase')
)
const baseMetrics = computed(() => {
  const base = props.knowledgeBase
  if (!base) return []
  return [
    { label: t('aiKnowledge.table.chunk'), value: `${base.chunk_size_chars} / ${base.chunk_overlap_chars}` },
    { label: t('aiKnowledge.form.defaultTopK'), value: String(base.default_top_k) },
    { label: t('aiKnowledge.form.defaultMinScore'), value: String(base.default_min_score) },
    { label: t('aiKnowledge.form.defaultContext'), value: String(base.default_max_context_chars) },
  ]
})
const hasBase = computed(() => Boolean(props.knowledgeBase))
const statusType = computed(() => (props.knowledgeBase?.status === CommonEnum.YES ? 'success' : 'danger'))

function addDocument() {
  emit('add')
}

function openRetrievalTest() {
  emit('retrieval-test')
}
</script>

<template>
  <div
    class="knowledge-document-hero"
    :class="{ 'is-empty': !knowledgeBase }"
  >
    <div class="knowledge-document-hero__main">
      <span class="knowledge-document-hero__eyebrow">
        {{ t('aiKnowledge.document.currentBase') }}
      </span>
      <h3>{{ selectedBaseName }}</h3>
      <p>
        {{ knowledgeBase ? (knowledgeBase.description || knowledgeBase.code) : t('aiKnowledge.document.selectBaseTip') }}
      </p>
      <div
        v-if="knowledgeBase"
        class="knowledge-document-hero__tags"
      >
        <el-tag type="info">
          {{ knowledgeBase.code }}
        </el-tag>
        <el-tag :type="statusType">
          {{ knowledgeBase.status_name || knowledgeBase.status }}
        </el-tag>
      </div>
    </div>
    <div
      v-if="knowledgeBase"
      class="knowledge-document-hero__metrics"
    >
      <div
        v-for="item in baseMetrics"
        :key="item.label"
        class="knowledge-document-hero__metric"
      >
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>
    <div class="knowledge-document-hero__actions">
      <el-button
        type="primary"
        :disabled="!hasBase"
        @click="addDocument"
      >
        {{ t('aiKnowledge.document.add') }}
      </el-button>
      <el-button
        type="success"
        :disabled="!hasBase"
        @click="openRetrievalTest"
      >
        {{ t('aiKnowledge.actions.retrievalTest') }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.knowledge-document-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 16px;
  align-items: stretch;
  padding: 18px;
  margin-bottom: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background:
    linear-gradient(135deg, rgb(64 158 255 / 10%), transparent 48%),
    var(--el-bg-color);
  box-shadow: 0 10px 30px rgb(15 23 42 / 4%);
}

.knowledge-document-hero.is-empty {
  grid-template-columns: minmax(0, 1fr) auto;
}

.knowledge-document-hero__main {
  min-width: 0;
}

.knowledge-document-hero__eyebrow {
  display: block;
  margin-bottom: 6px;
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
}

.knowledge-document-hero h3,
.knowledge-document-hero p {
  margin: 0;
}

.knowledge-document-hero h3 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary);
  font-size: 18px;
}

.knowledge-document-hero p {
  display: -webkit-box;
  margin-top: 6px;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.knowledge-document-hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.knowledge-document-hero__metrics {
  display: grid;
  grid-template-columns: repeat(2, 112px);
  gap: 8px;
}

.knowledge-document-hero__metric {
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: rgb(255 255 255 / 54%);
}

.knowledge-document-hero__metric span {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.knowledge-document-hero__metric strong {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.knowledge-document-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  align-content: flex-start;
}

.knowledge-document-hero__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

@media (max-width: 1280px) {
  .knowledge-document-hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .knowledge-document-hero__metrics {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .knowledge-document-hero__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
