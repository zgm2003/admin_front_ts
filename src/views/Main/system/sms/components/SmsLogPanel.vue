<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppDialog } from '@/components/AppDialog'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { AppTable } from '@/components/Table'
import { useCrudTable } from '@/hooks/useCrudTable'
import { useUserStore } from '@/store/user'
import {
  SmsApi,
  type SmsLogItem,
  type SmsLogListParams,
  type SmsLogScene,
  type SmsLogStatus,
} from '@/api/system/sms'
import { createDefaultSmsDict, normalizeSmsDict } from '../smsDict'

interface SmsLogSearchForm {
  scene: SmsLogScene | ''
  status: SmsLogStatus | ''
  to_phone: string
  dateRange: string[]
}

const { t } = useI18n()
const userStore = useUserStore()
const detailLoading = shallowRef(false)
const detailVisible = shallowRef(false)
const detail = ref<SmsLogItem | null>(null)
const searchForm = ref<SmsLogSearchForm>({
  scene: '',
  status: '',
  to_phone: '',
  dateRange: [],
})
const dict = ref(createDefaultSmsDict())

const smsLogCrudApi = {
  list: SmsApi.logs,
  deleteOne: SmsApi.deleteLogs,
  deleteBatch: ({ ids }: { ids: number[] }) => SmsApi.deleteLogs({ id: ids }),
}

const canDelete = computed(() => userStore.can('system_sms_logDel'))
const apiSearchForm = computed(() => {
  const [start, end] = searchForm.value.dateRange

  return {
    scene: searchForm.value.scene,
    status: searchForm.value.status,
    to_phone: searchForm.value.to_phone,
    created_at_start: start ?? '',
    created_at_end: end ?? '',
  }
})

const {
  loading,
  data: logs,
  page,
  selectedIds,
  onPageChange,
  onSelectionChange,
  onSearch,
  refresh,
  getList,
  batchDel,
  confirmDel,
} = useCrudTable<SmsLogItem, SmsLogListParams>({
  api: smsLogCrudApi,
  searchForm: apiSearchForm,
  immediate: true,
})

async function refreshLogs() {
  await getList()
}

defineExpose({ refreshLogs })

const searchFields = computed<SearchField[]>(() => [
  {
    key: 'scene',
    type: 'select-v2',
    label: t('sms.log.scene'),
    placeholder: t('sms.log.scene'),
    options: dict.value.sms_log_scene_arr,
    width: 160,
  },
  {
    key: 'status',
    type: 'select-v2',
    label: t('sms.log.status'),
    placeholder: t('sms.log.status'),
    options: dict.value.sms_log_status_arr,
    width: 140,
  },
  {
    key: 'to_phone',
    type: 'input',
    label: t('sms.log.toPhone'),
    placeholder: t('sms.log.toPhone'),
    width: 220,
  },
  {
    key: 'dateRange',
    type: 'slot',
    label: t('sms.log.createdAt'),
    width: 300,
  },
])
const columns = computed(() => [
  { key: 'id', label: 'ID', width: 90 },
  { key: 'scene', label: t('sms.log.scene'), minWidth: 150 },
  { key: 'to_phone', label: t('sms.log.toPhone'), minWidth: 170 },
  { key: 'status', label: t('sms.log.status'), width: 120, overflowTooltip: false },
  { key: 'tencent_fee', label: t('sms.log.fee'), width: 100 },
  { key: 'error_code', label: t('sms.log.errorCode'), minWidth: 180 },
  { key: 'duration_ms', label: t('sms.log.duration'), width: 120 },
  { key: 'created_at', label: t('sms.log.createdAt'), width: 180 },
  { key: 'actions', label: t('common.actions.action'), width: 160, fixed: 'right', overflowTooltip: false },
])

function sceneLabel(scene: SmsLogScene) {
  return dict.value.sms_log_scene_arr.find((item) => item.value === scene)?.label || scene
}

function statusLabel(status: SmsLogStatus) {
  return dict.value.sms_log_status_arr.find((item) => item.value === status)?.label || String(status)
}

function statusType(status: SmsLogStatus) {
  if (status === 2) {
    return 'success'
  }
  if (status === 3) {
    return 'danger'
  }
  return 'warning'
}

async function loadDict() {
  const initData = await SmsApi.pageInit()
  dict.value = normalizeSmsDict(initData.dict)
}

async function openDetail(row: SmsLogItem) {
  detailVisible.value = true
  detailLoading.value = true
  try {
    detail.value = await SmsApi.log(row.id)
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => {
  void loadDict()
})
</script>

<template>
  <div class="sms-log">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      :collapse-count="3"
      @query="onSearch"
      @reset="onSearch"
    >
      <template #dateRange="{ form }">
        <el-date-picker
          v-model="form.dateRange"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
          :start-placeholder="t('sms.log.startTime')"
          :end-placeholder="t('sms.log.endTime')"
        />
      </template>
    </Search>

    <div class="sms-log__table">
      <AppTable
        :columns="columns"
        :data="logs"
        :loading="loading"
        :pagination="page"
        row-key="id"
        selectable
        @selection-change="onSelectionChange"
        @update:pagination="onPageChange"
        @refresh="refresh"
      >
        <template #toolbar-left>
          <el-button
            v-if="canDelete"
            type="danger"
            :disabled="selectedIds.length === 0"
            @click="batchDel"
          >
            {{ t('common.actions.batchDelete') }}
          </el-button>
        </template>

        <template #cell-scene="{ row }">
          {{ sceneLabel(row.scene) }}
        </template>

        <template #cell-status="{ row }">
          <el-tag :type="statusType(row.status)">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>

        <template #cell-actions="{ row }">
          <el-button
            type="primary"
            text
            @click="openDetail(row)"
          >
            {{ t('common.actions.detail') }}
          </el-button>
          <el-button
            v-if="canDelete"
            type="danger"
            text
            @click="confirmDel(row)"
          >
            {{ t('common.actions.del') }}
          </el-button>
        </template>
      </AppTable>
    </div>

    <AppDialog
      v-model="detailVisible"
      :title="t('sms.log.detailTitle')"
      width="760px"
    >
      <el-skeleton
        v-if="detailLoading"
        :rows="6"
        animated
      />
      <template v-else-if="detail">
        <el-descriptions
          :column="2"
          border
        >
          <el-descriptions-item label="ID">
            {{ detail.id }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('sms.log.scene')">
            {{ sceneLabel(detail.scene) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('sms.log.toPhone')">
            {{ detail.to_phone }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('sms.log.status')">
            <el-tag :type="statusType(detail.status)">
              {{ statusLabel(detail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('sms.log.duration')">
            {{ detail.duration_ms }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('sms.log.fee')">
            {{ detail.tencent_fee }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('sms.log.requestId')">
            {{ detail.tencent_request_id || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('sms.log.serialNo')">
            {{ detail.tencent_serial_no || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('sms.log.errorCode')">
            {{ detail.error_code || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('sms.log.errorMessage')">
            {{ detail.error_message || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('sms.log.sentAt')">
            {{ detail.sent_at || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('sms.common.createdAt')">
            {{ detail.created_at || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-alert
          class="sms-log__notice"
          type="info"
          :closable="false"
          :title="t('sms.log.securityNotice')"
        />
        <el-descriptions
          v-if="detail.template"
          class="sms-log__template"
          :title="t('sms.log.templateTitle')"
          :column="2"
          border
        >
          <el-descriptions-item :label="t('sms.log.templateScene')">
            {{ sceneLabel(detail.template.scene) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('sms.log.templateName')">
            {{ detail.template.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('sms.template.tencentTemplateId')">
            {{ detail.template.tencent_template_id }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('sms.template.variables')">
            <el-space wrap>
              <el-tag
                v-for="item in detail.template.variables"
                :key="item"
                size="small"
              >
                {{ item }}
              </el-tag>
            </el-space>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </AppDialog>
  </div>
</template>

<style scoped>
.sms-log {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
  gap: 14px;
}

.sms-log__table {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.sms-log__notice,
.sms-log__template {
  margin-top: 14px;
}
</style>
