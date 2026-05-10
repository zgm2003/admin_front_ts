<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import {
  AiKnowledgeApi,
  type AiKnowledgeBaseItem,
  type AiKnowledgeRetrievalHit,
  type AiKnowledgeRetrievalTestResponse,
} from '@/api/ai/knowledge'

interface RetrievalForm {
  query: string
  top_k: number
  min_score: number
  max_context_chars: number
}

interface Props {
  modelValue: boolean
  knowledgeBase: AiKnowledgeBaseItem | null
}

interface Emits {
  'update:modelValue': [value: boolean]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()
const isMobile = useIsMobile()

const loading = ref(false)
const result = ref<AiKnowledgeRetrievalTestResponse | null>(null)
const form = ref<RetrievalForm>(defaultForm())

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const selectedHits = computed(() => result.value?.hits.filter((hit) => hit.status === 1) ?? [])

function defaultForm(): RetrievalForm {
  return {
    query: '',
    top_k: props.knowledgeBase?.default_top_k ?? 5,
    min_score: props.knowledgeBase?.default_min_score ?? 0.1,
    max_context_chars: props.knowledgeBase?.default_max_context_chars ?? 6000,
  }
}

function hitStatusName(row: AiKnowledgeRetrievalHit) {
  if (row.status === 1) return t('aiKnowledge.retrieval.selected')
  if (row.skip_reason) return row.skip_reason
  return t('aiKnowledge.retrieval.skipped')
}

async function submit() {
  const baseID = props.knowledgeBase?.id
  if (!baseID) {
    ElNotification.warning({ message: t('aiKnowledge.document.selectBase') })
    return
  }
  const query = form.value.query.trim()
  if (!query) {
    ElNotification.warning({ message: t('aiKnowledge.retrieval.queryRequired') })
    return
  }
  loading.value = true
  try {
    result.value = await AiKnowledgeApi.retrievalTest({
      knowledge_base_id: baseID,
      query,
      top_k: form.value.top_k,
      min_score: form.value.min_score,
      max_context_chars: form.value.max_context_chars,
    })
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.modelValue, props.knowledgeBase?.id] as const,
  ([open]) => {
    if (!open) return
    form.value = defaultForm()
    result.value = null
  }
)
</script>

<template>
  <AppDialog v-model="visible" :width="isMobile ? '94vw' : '860px'" height="68vh">
    <template #header>{{ t('aiKnowledge.retrieval.title') }} - {{ knowledgeBase?.name || '-' }}</template>
    <div class="retrieval-test-dialog">
      <el-form :model="form" label-width="auto">
        <el-form-item :label="t('aiKnowledge.retrieval.query')" required>
          <el-input v-model="form.query" type="textarea" :rows="3" :placeholder="t('aiKnowledge.retrieval.queryPlaceholder')" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :md="8" :span="24">
            <el-form-item label="TopK">
              <el-input-number v-model="form.top_k" :min="1" :max="20" class="retrieval-test-dialog__number" />
            </el-form-item>
          </el-col>
          <el-col :md="8" :span="24">
            <el-form-item :label="t('aiKnowledge.form.defaultMinScore')">
              <el-input-number v-model="form.min_score" :min="0" :max="100" :step="0.01" class="retrieval-test-dialog__number" />
            </el-form-item>
          </el-col>
          <el-col :md="8" :span="24">
            <el-form-item :label="t('aiKnowledge.form.defaultContext')">
              <el-input-number v-model="form.max_context_chars" :min="1000" :max="30000" :step="500" class="retrieval-test-dialog__number" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <el-alert v-if="result" type="success" :closable="false" class="retrieval-test-dialog__summary">
        <template #title>
          {{ t('aiKnowledge.retrieval.summary', { selected: result.selected_hits, total: result.total_hits }) }}
        </template>
      </el-alert>

      <el-table v-if="result" v-loading="loading" :data="result.hits" border>
        <el-table-column prop="rank_no" :label="t('aiKnowledge.retrieval.rank')" width="80" />
        <el-table-column prop="score" :label="t('aiKnowledge.retrieval.score')" width="90" />
        <el-table-column prop="knowledge_base_name" :label="t('aiKnowledge.table.name')" min-width="150" show-overflow-tooltip />
        <el-table-column prop="document_title" :label="t('aiKnowledge.document.title')" min-width="150" show-overflow-tooltip />
        <el-table-column :label="t('aiKnowledge.retrieval.hitStatus')" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ hitStatusName(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('aiKnowledge.chunk.content')" min-width="260">
          <template #default="{ row }">
            <el-text line-clamp="3">{{ row.content }}</el-text>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="selectedHits.length" class="retrieval-test-dialog__selected">
        <div class="retrieval-test-dialog__selected-title">{{ t('aiKnowledge.retrieval.selected') }}</div>
        <el-tag v-for="hit in selectedHits" :key="hit.chunk_id" type="success">
          #{{ hit.rank_no }} {{ hit.document_title }} / {{ hit.chunk_index }}
        </el-tag>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="submit">{{ t('aiKnowledge.actions.retrievalTest') }}</el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.retrieval-test-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.retrieval-test-dialog__number {
  width: 100%;
}

.retrieval-test-dialog__summary {
  margin-bottom: 2px;
}

.retrieval-test-dialog__selected {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.retrieval-test-dialog__selected-title {
  width: 100%;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
