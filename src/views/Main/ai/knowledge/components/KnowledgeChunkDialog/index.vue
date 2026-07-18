<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import {
  AiKnowledgeApi,
  type AiKnowledgeChunkItem,
  type AiKnowledgeDocumentItem,
} from '@/api/ai/knowledge'

interface Props {
  modelValue: boolean
  document: AiKnowledgeDocumentItem | null
}

interface Emits {
  'update:modelValue': [value: boolean]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()
const isMobile = useIsMobile()

const loading = ref(false)
const chunks = ref<AiKnowledgeChunkItem[]>([])

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

async function loadChunks() {
  const documentID = props.document?.id
  if (!documentID) {
    chunks.value = []
    return
  }
  loading.value = true
  try {
    const data = await AiKnowledgeApi.chunks({ id: documentID })
    chunks.value = data.list
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.modelValue, props.document?.id] as const,
  ([open]) => {
    if (!open) return
    loadChunks().catch((error: unknown) => {
      ElNotification.error({ message: error instanceof Error ? error.message : t('aiKnowledge.document.chunkLoadFailed') })
    })
  }
)
</script>

<template>
  <AppDialog
    v-model="visible"
    :width="isMobile ? '94vw' : '820px'"
    height="64vh"
  >
    <template #header>
      {{ t('aiKnowledge.document.chunks') }} - {{ document?.title || '-' }}
    </template>
    <el-table
      v-loading="loading"
      :data="chunks"
      border
      class="knowledge-chunk-dialog__table"
    >
      <el-table-column
        prop="chunk_index"
        :label="t('aiKnowledge.chunk.index')"
        width="90"
      />
      <el-table-column
        prop="content_chars"
        :label="t('aiKnowledge.chunk.chars')"
        width="100"
      />
      <el-table-column
        prop="status_name"
        :label="t('aiKnowledge.table.status')"
        width="100"
      />
      <el-table-column
        :label="t('aiKnowledge.chunk.content')"
        min-width="420"
      >
        <template #default="{ row }">
          <div class="knowledge-chunk-dialog__content">
            {{ row.content }}
          </div>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button @click="visible = false">
        {{ t('common.actions.close') }}
      </el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.knowledge-chunk-dialog__table {
  width: 100%;
}

.knowledge-chunk-dialog__content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
}
</style>
