<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { CommonEnum } from '@/enums'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { useCrudTable } from '@/hooks/useCrudTable'
import {
  AiKnowledgeApi,
  type AiKnowledgeBaseItem,
  type AiKnowledgeInitResponse,
} from '@/api/ai/knowledge'
import KnowledgeBaseFormDialog from '../KnowledgeBaseFormDialog/index.vue'

interface Props {
  selectedBase: AiKnowledgeBaseItem | null
}

interface Emits {
  'update:selectedBase': [value: AiKnowledgeBaseItem | null]
  select: [row: AiKnowledgeBaseItem]
}

defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const dict = shallowRef<AiKnowledgeInitResponse['dict']>({
  common_status_arr: [],
  source_type_arr: [],
  index_status_arr: [],
})

const searchForm = ref({
  name: '',
  code: '',
  status: '' as number | '',
})

const {
  loading: listLoading,
  data: listData,
  page,
  onSearch,
  onPageChange,
  refresh,
  getList,
  confirmDel,
  toggleStatus,
} = useCrudTable<AiKnowledgeBaseItem>({
  api: AiKnowledgeApi,
  searchForm,
  afterDel: () => emit('update:selectedBase', null),
})

const formVisible = shallowRef(false)
const formMode = shallowRef<'add' | 'edit'>('add')
const editingBase = shallowRef<AiKnowledgeBaseItem | null>(null)

const searchFields = computed<SearchField[]>(() => [
  { key: 'name', type: 'input', label: t('aiKnowledge.filter.name'), placeholder: t('aiKnowledge.filter.name'), width: 170 },
  { key: 'code', type: 'input', label: t('aiKnowledge.filter.code'), placeholder: t('aiKnowledge.filter.code'), width: 170 },
  { key: 'status', type: 'select-v2', label: t('aiKnowledge.filter.status'), placeholder: t('aiKnowledge.filter.status'), width: 120, options: dict.value.common_status_arr },
])

const columns = computed(() => [
  { key: 'name', label: t('aiKnowledge.table.name'), minWidth: 160 },
  { key: 'code', label: t('aiKnowledge.table.code'), width: 160 },
  { key: 'description', label: t('aiKnowledge.table.description'), minWidth: 220, overflowTooltip: true },
  { key: 'chunk_size_chars', label: t('aiKnowledge.table.chunk'), width: 130 },
  { key: 'default_top_k', label: t('aiKnowledge.table.retrieval'), width: 150 },
  { key: 'status', label: t('aiKnowledge.table.status'), width: 90 },
  { key: 'updated_at', label: t('aiKnowledge.table.updatedAt'), width: 160 },
  { key: 'actions', label: t('common.actions.action'), width: 330, fixed: 'right' },
])

async function loadInit() {
  const data = await AiKnowledgeApi.init()
  dict.value = data.dict
}

function openAdd() {
  formMode.value = 'add'
  editingBase.value = null
  formVisible.value = true
}

function openEdit(row: AiKnowledgeBaseItem) {
  formMode.value = 'edit'
  editingBase.value = row
  formVisible.value = true
}

function selectRow(row: AiKnowledgeBaseItem) {
  emit('update:selectedBase', row)
  emit('select', row)
}

async function afterSaved() {
  await getList()
}

onMounted(() => {
  loadInit().catch((error: unknown) => {
    ElNotification.error({ message: error instanceof Error ? error.message : t('aiKnowledge.initFailed') })
  })
  void getList()
})
</script>

<template>
  <div class="knowledge-base-list">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
    <AppTable
      :columns="columns"
      :data="listData"
      :loading="listLoading"
      row-key="id"
      :pagination="page"
      :show-index="true"
      @refresh="refresh"
      @update:pagination="onPageChange"
    >
      <template #toolbar-left>
        <el-button type="success" @click="openAdd">{{ t('common.actions.add') }}</el-button>
      </template>
      <template #cell-name="{ row }">
        <el-button text type="primary" @click="selectRow(row)">{{ row.name }}</el-button>
      </template>
      <template #cell-chunk_size_chars="{ row }">
        <span>{{ row.chunk_size_chars }} / {{ row.chunk_overlap_chars }}</span>
      </template>
      <template #cell-default_top_k="{ row }">
        <span>TopK {{ row.default_top_k }} · {{ row.default_min_score }}</span>
      </template>
      <template #cell-status="{ row }">
        <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">{{ row.status_name || row.status }}</el-tag>
      </template>
      <template #cell-actions="{ row }">
        <el-button type="primary" text @click="openEdit(row)">{{ t('common.actions.edit') }}</el-button>
        <el-button type="info" text @click="selectRow(row)">{{ t('aiKnowledge.document.title') }}</el-button>
        <el-button v-if="row.status === CommonEnum.NO" type="warning" text @click="toggleStatus(row, CommonEnum.YES)">{{ t('common.actions.enable') }}</el-button>
        <el-button v-if="row.status === CommonEnum.YES" type="warning" text @click="toggleStatus(row, CommonEnum.NO)">{{ t('common.actions.disable') }}</el-button>
        <el-button type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
      </template>
    </AppTable>

    <KnowledgeBaseFormDialog
      v-model="formVisible"
      :mode="formMode"
      :row="editingBase"
      :dict="dict"
      @saved="afterSaved"
    />
  </div>
</template>

<style scoped>
.knowledge-base-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: auto;
}
</style>
