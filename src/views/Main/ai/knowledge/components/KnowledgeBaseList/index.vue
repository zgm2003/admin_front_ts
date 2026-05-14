<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { useCrudTable } from '@/hooks/useCrudTable'
import {
  AiKnowledgeApi,
  type AiKnowledgeBaseItem,
  type AiKnowledgeInitResponse,
} from '@/api/ai/knowledge'
import KnowledgeBaseCard from '../KnowledgeBaseCard/index.vue'
import KnowledgeBaseFormDialog from '../KnowledgeBaseFormDialog/index.vue'

interface Props {
  selectedBase: AiKnowledgeBaseItem | null
}

interface Emits {
  'update:selectedBase': [value: AiKnowledgeBaseItem | null]
  select: [row: AiKnowledgeBaseItem]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const dict = shallowRef<AiKnowledgeInitResponse['dict']>({
  common_status_arr: [],
  source_type_arr: [],
  index_status_arr: [],
})

const searchForm = ref({
  name: '',
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
  initPage: { page_size: 10 },
  afterDel: () => emit('update:selectedBase', null),
})

const formVisible = shallowRef(false)
const formMode = shallowRef<'add' | 'edit'>('add')
const editingBase = shallowRef<AiKnowledgeBaseItem | null>(null)

const hasFilters = computed(() => Boolean(searchForm.value.name || searchForm.value.status))
const totalText = computed(() => t('aiKnowledge.nav.total', { count: page.value.total }))

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

function resetSearch() {
  searchForm.value = { name: '', status: '' }
  onSearch()
}

function selectRow(row: AiKnowledgeBaseItem) {
  emit('update:selectedBase', row)
  emit('select', row)
}

async function afterSaved() {
  await getList()
}

function isSelected(row: AiKnowledgeBaseItem) {
  return props.selectedBase?.id === row.id
}

watch(
  listData,
  (rows) => {
    const selectedID = props.selectedBase?.id
    if (!selectedID && rows.length > 0) {
      const first = rows[0]
      if (first) selectRow(first)
      return
    }
    const selectedRow = rows.find((item) => item.id === selectedID)
    if (!selectedRow) {
      emit('update:selectedBase', null)
      return
    }
    if (selectedRow !== props.selectedBase) {
      emit('update:selectedBase', selectedRow)
    }
  },
)

onMounted(() => {
  loadInit().catch((error: unknown) => {
    ElNotification.error({ message: error instanceof Error ? error.message : t('aiKnowledge.initFailed') })
  })
  void getList()
})
</script>

<template>
  <aside class="knowledge-base-nav">
    <div class="knowledge-base-nav__header">
      <div>
        <h3>{{ t('aiKnowledge.nav.title') }}</h3>
        <p>{{ t('aiKnowledge.nav.subtitle') }}</p>
      </div>
      <el-button
        type="primary"
        @click="openAdd"
      >
        {{ t('common.actions.add') }}
      </el-button>
    </div>

    <div class="knowledge-base-nav__filters">
      <el-input
        v-model="searchForm.name"
        clearable
        :placeholder="t('aiKnowledge.filter.name')"
        @keyup.enter="onSearch"
        @clear="onSearch"
      />
      <el-select-v2
        v-model="searchForm.status"
        clearable
        :options="dict.common_status_arr"
        :placeholder="t('aiKnowledge.filter.status')"
        @change="onSearch"
      />
      <div class="knowledge-base-nav__filter-actions">
        <el-button
          type="primary"
          plain
          @click="onSearch"
        >
          {{ t('common.actions.query') }}
        </el-button>
        <el-button
          :disabled="!hasFilters"
          @click="resetSearch"
        >
          {{ t('common.actions.reset') }}
        </el-button>
      </div>
    </div>

    <div class="knowledge-base-nav__meta">
      <span>{{ totalText }}</span>
      <el-button
        text
        type="primary"
        @click="refresh"
      >
        {{ t('common.actions.refresh') }}
      </el-button>
    </div>

    <div
      v-loading="listLoading"
      class="knowledge-base-nav__list"
    >
      <el-empty
        v-if="listData.length === 0"
        :description="t('aiKnowledge.nav.empty')"
        :image-size="96"
      />
      <KnowledgeBaseCard
        v-for="row in listData"
        :key="row.id"
        :row="row"
        :selected="isSelected(row)"
        @select="selectRow"
        @edit="openEdit"
        @toggle="toggleStatus"
        @remove="confirmDel"
      />
    </div>

    <div
      v-if="page.total > page.page_size"
      class="knowledge-base-nav__pagination"
    >
      <el-pagination
        small
        layout="prev, pager, next"
        :current-page="page.current_page"
        :page-size="page.page_size"
        :total="page.total"
        @current-change="(currentPage: number) => onPageChange({ ...page, current_page: currentPage })"
      />
    </div>

    <KnowledgeBaseFormDialog
      v-model="formVisible"
      :mode="formMode"
      :row="editingBase"
      :dict="dict"
      @saved="afterSaved"
    />
  </aside>
</template>

<style scoped>
.knowledge-base-nav {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
  box-shadow: 0 10px 30px rgb(15 23 42 / 4%);
}

.knowledge-base-nav__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.knowledge-base-nav__header h3,
.knowledge-base-nav__header p {
  margin: 0;
}

.knowledge-base-nav__header h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.knowledge-base-nav__header p {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.knowledge-base-nav__filters {
  display: grid;
  gap: 8px;
  margin-bottom: 10px;
}

.knowledge-base-nav__filter-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.knowledge-base-nav__filter-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.knowledge-base-nav__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.knowledge-base-nav__list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
}

.knowledge-base-nav__pagination {
  display: flex;
  justify-content: center;
  padding-top: 10px;
}
</style>
