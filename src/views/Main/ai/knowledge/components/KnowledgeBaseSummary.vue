<script setup lang="ts">
import { CommonEnum } from '@/enums'
import type { AiKnowledgeBaseItem } from '@/api/ai/knowledge'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  base: AiKnowledgeBaseItem
}>()

const { t } = useI18n()
</script>

<template>
  <section class="base-summary">
    <div class="base-summary__main">
      <span class="base-summary__eyebrow">{{ t('aiKnowledge.table.name') }}</span>
      <h3>{{ props.base.name }}</h3>
      <p>{{ props.base.description || t('common.noData') }}</p>
    </div>

    <div class="base-summary__meta">
      <el-tag>{{ props.base.visibility_name }}</el-tag>
      <el-tag :type="props.base.status === CommonEnum.YES ? 'success' : 'danger'">
        {{ props.base.status_name }}
      </el-tag>
      <el-tag type="info">
        {{ t('aiKnowledge.form.chunkSize') }} {{ props.base.chunk_size }} ·
        {{ t('aiKnowledge.form.chunkOverlap') }} {{ props.base.chunk_overlap }}
      </el-tag>
      <el-tag type="info">
        {{ t('aiKnowledge.form.topK') }} {{ props.base.top_k }} ·
        {{ t('aiKnowledge.form.scoreThreshold') }} {{ props.base.score_threshold }}
      </el-tag>
    </div>
  </section>
</template>

<style scoped>
.base-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
}

.base-summary__main {
  min-width: 0;
}

.base-summary__eyebrow {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1;
}

.base-summary__main h3,
.base-summary__main p {
  margin: 0;
}

.base-summary__main h3 {
  margin-top: 4px;
  color: var(--el-text-color-primary);
  font-size: 18px;
  line-height: 1.35;
}

.base-summary__main p {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.base-summary__meta {
  display: flex;
  max-width: 52%;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 768px) {
  .base-summary {
    flex-direction: column;
  }

  .base-summary__meta {
    max-width: none;
    justify-content: flex-start;
  }
}
</style>
