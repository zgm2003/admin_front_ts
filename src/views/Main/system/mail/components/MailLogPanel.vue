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
  MailApi,
  type MailLogItem,
  type MailLogListParams,
  type MailLogScene,
  type MailLogStatus,
  type MailPageInitResponse,
} from '@/api/system/mail'

interface MailLogSearchForm {
  scene: MailLogScene | ''
  status: MailLogStatus | ''
  to_email: string
  dateRange: string[]
}

const { t } = useI18n()
const userStore = useUserStore()
const detailLoading = shallowRef(false)
const detailVisible = shallowRef(false)
const detail = ref<MailLogItem | null>(null)
const searchForm = ref<MailLogSearchForm>({
  scene: '',
  status: '',
  to_email: '',
  dateRange: [],
})
const dict = ref<MailPageInitResponse['dict']>({
  common_status_arr: [],
  mail_scene_arr: [],
  mail_log_scene_arr: [],
  mail_log_status_arr: [],
  default_region: 'ap-guangzhou',
  default_endpoint: 'ses.tencentcloudapi.com',
})

const mailLogCrudApi = {
  list: MailApi.logs,
  del: MailApi.deleteLogs,
}

const canDelete = computed(() => userStore.can('system_mail_logDel'))
const apiSearchForm = computed(() => {
  const [start, end] = searchForm.value.dateRange

  return {
    scene: searchForm.value.scene,
    status: searchForm.value.status,
    to_email: searchForm.value.to_email,
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
  batchDel,
  confirmDel,
} = useCrudTable<MailLogItem, MailLogListParams>({
  api: mailLogCrudApi,
  searchForm: apiSearchForm,
  immediate: true,
})

const searchFields = computed<SearchField[]>(() => [
  {
    key: 'scene',
    type: 'select-v2',
    label: t('mail.log.scene'),
    placeholder: t('mail.log.scene'),
    options: dict.value.mail_log_scene_arr,
    width: 160,
  },
  {
    key: 'status',
    type: 'select-v2',
    label: t('mail.log.status'),
    placeholder: t('mail.log.status'),
    options: dict.value.mail_log_status_arr,
    width: 140,
  },
  {
    key: 'to_email',
    type: 'input',
    label: t('mail.log.toEmail'),
    placeholder: t('mail.log.toEmail'),
    width: 220,
  },
  {
    key: 'dateRange',
    type: 'slot',
    label: t('mail.log.createdAt'),
    width: 300,
  },
])
const columns = computed(() => [
  { key: 'id', label: 'ID', width: 90 },
  { key: 'scene', label: t('mail.log.scene'), minWidth: 150 },
  { key: 'to_email', label: t('mail.log.toEmail'), minWidth: 210 },
  { key: 'subject', label: t('mail.log.subject'), minWidth: 180 },
  { key: 'status', label: t('mail.log.status'), width: 120, overflowTooltip: false },
  { key: 'error_code', label: t('mail.log.errorCode'), minWidth: 180 },
  { key: 'duration_ms', label: t('mail.log.duration'), width: 120 },
  { key: 'created_at', label: t('mail.log.createdAt'), width: 180 },
  { key: 'actions', label: t('common.actions.action'), width: 160, fixed: 'right', overflowTooltip: false },
])

function sceneLabel(scene: MailLogScene) {
  return dict.value.mail_log_scene_arr.find((item) => item.value === scene)?.label || scene
}

function statusLabel(status: MailLogStatus) {
  return dict.value.mail_log_status_arr.find((item) => item.value === status)?.label || String(status)
}

function statusType(status: MailLogStatus) {
  if (status === 2) {
    return 'success'
  }
  if (status === 3) {
    return 'danger'
  }
  return 'warning'
}

async function loadDict() {
  const initData = await MailApi.pageInit()
  dict.value = initData.dict
}

async function openDetail(row: MailLogItem) {
  detailVisible.value = true
  detailLoading.value = true
  try {
    detail.value = await MailApi.log(row.id)
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => {
  void loadDict()
})
</script>

<template>
  <div class="mail-log">
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
          :start-placeholder="t('mail.log.startTime')"
          :end-placeholder="t('mail.log.endTime')"
        />
      </template>
    </Search>

    <AppTable
      :columns="columns"
      :data="logs"
      :loading="loading"
      :pagination="page"
      row-key="id"
      selectable
      :fixed-footer="false"
      @selection-change="onSelectionChange"
      @update:pagination="onPageChange"
      @refresh="refresh"
    >
      <template #toolbar-left>
        <el-button v-if="canDelete" type="danger" :disabled="selectedIds.length === 0" @click="batchDel">
          {{ t('common.actions.batchDelete') }}
        </el-button>
      </template>

      <template #cell-scene="{ row }">
        {{ sceneLabel(row.scene) }}
      </template>

      <template #cell-status="{ row }">
        <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
      </template>

      <template #cell-actions="{ row }">
        <el-button type="primary" text @click="openDetail(row)">{{ t('common.actions.detail') }}</el-button>
        <el-button v-if="canDelete" type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
      </template>
    </AppTable>

    <AppDialog v-model="detailVisible" :title="t('mail.log.detailTitle')" width="760px">
      <el-skeleton v-if="detailLoading" :rows="6" animated />
      <el-descriptions v-else-if="detail" :column="2" border>
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item :label="t('mail.log.scene')">{{ sceneLabel(detail.scene) }}</el-descriptions-item>
        <el-descriptions-item :label="t('mail.log.toEmail')">{{ detail.to_email }}</el-descriptions-item>
        <el-descriptions-item :label="t('mail.log.subject')">{{ detail.subject || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('mail.log.status')">
          <el-tag :type="statusType(detail.status)">{{ statusLabel(detail.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('mail.log.duration')">{{ detail.duration_ms }}</el-descriptions-item>
        <el-descriptions-item :label="t('mail.log.requestId')">{{ detail.tencent_request_id || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('mail.log.messageId')">{{ detail.tencent_message_id || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('mail.log.errorCode')">{{ detail.error_code || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('mail.log.errorMessage')">{{ detail.error_message || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('mail.log.sentAt')">{{ detail.sent_at || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('mail.common.createdAt')">{{ detail.created_at || '-' }}</el-descriptions-item>
      </el-descriptions>
    </AppDialog>
  </div>
</template>

<style scoped>
.mail-log {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
