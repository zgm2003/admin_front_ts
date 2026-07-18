<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { useCrudTable } from '@/hooks/useCrudTable'
import {
  AiToolApi,
  type AiToolInitResponse,
  type AiToolItem,
  type AiToolRiskLevel,
} from '@/api/ai/tools'

interface Props {
  dict: AiToolInitResponse['dict']
  refreshSignal: number
}

interface Emits {
  add: []
  generate: []
  edit: [row: AiToolItem]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()
const userStore = useUserStore()

const searchForm = ref({
  name: '',
  code: '',
  risk_level: '' as AiToolRiskLevel | '',
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
} = useCrudTable<AiToolItem>({
  api: AiToolApi,
  searchForm,
})

const searchFields = computed<SearchField[]>(() => [
  { key: 'name', type: 'input', label: t('aiTools.filter.name'), placeholder: t('aiTools.filter.name'), width: 170 },
  { key: 'code', type: 'input', label: t('aiTools.filter.code'), placeholder: t('aiTools.filter.code'), width: 170 },
  { key: 'risk_level', type: 'select-v2', label: t('aiTools.filter.riskLevel'), placeholder: t('aiTools.filter.riskLevel'), width: 130, options: props.dict.risk_level_arr },
  { key: 'status', type: 'select-v2', label: t('aiTools.filter.status'), placeholder: t('aiTools.filter.status'), width: 120, options: props.dict.common_status_arr },
])

const columns = computed(() => [
  { key: 'name', label: t('aiTools.table.name'), minWidth: 160 },
  { key: 'code', label: t('aiTools.table.code'), width: 160 },
  { key: 'description', label: t('aiTools.table.description'), minWidth: 220, overflowTooltip: true },
  { key: 'risk_level', label: t('aiTools.table.riskLevel'), width: 110 },
  { key: 'timeout_ms', label: t('aiTools.table.timeout'), width: 110 },
  { key: 'status', label: t('aiTools.table.status'), width: 90 },
  { key: 'updated_at', label: t('aiTools.table.updatedAt'), width: 160 },
  { key: 'actions', label: t('common.actions.action'), width: 280, fixed: 'right' },
])

function riskTagType(level: AiToolRiskLevel) {
  if (level === 'high') return 'danger'
  if (level === 'medium') return 'warning'
  return 'success'
}

watch(
  () => props.refreshSignal,
  () => {
    void getList()
  }
)

onMounted(() => {
  void getList()
})
</script>

<template>
  <div class="tool-list">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="onSearch"
      @reset="onSearch"
    />
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
        <el-button
          type="success"
          @click="emit('add')"
        >
          {{ t('common.actions.add') }}
        </el-button>
        <el-button
          v-if="userStore.can('ai_tool_generate')"
          type="primary"
          @click="emit('generate')"
        >
          {{ t('aiTools.actions.generate') }}
        </el-button>
      </template>
      <template #cell-risk_level="{ row }">
        <el-tag :type="riskTagType(row.risk_level)">
          {{ row.risk_level_name || row.risk_level }}
        </el-tag>
      </template>
      <template #cell-timeout_ms="{ row }">
        <span>{{ row.timeout_ms }}ms</span>
      </template>
      <template #cell-status="{ row }">
        <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">
          {{ row.status_name || row.status }}
        </el-tag>
      </template>
      <template #cell-actions="{ row }">
        <el-button
          type="primary"
          text
          @click="emit('edit', row)"
        >
          {{ t('common.actions.edit') }}
        </el-button>
        <el-button
          v-if="row.status === CommonEnum.NO"
          type="warning"
          text
          @click="toggleStatus(row, CommonEnum.YES)"
        >
          {{ t('common.actions.enable') }}
        </el-button>
        <el-button
          v-if="row.status === CommonEnum.YES"
          type="warning"
          text
          @click="toggleStatus(row, CommonEnum.NO)"
        >
          {{ t('common.actions.disable') }}
        </el-button>
        <el-button
          type="danger"
          text
          @click="confirmDel(row)"
        >
          {{ t('common.actions.del') }}
        </el-button>
      </template>
    </AppTable>
  </div>
</template>

<style scoped>
.tool-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
</style>
