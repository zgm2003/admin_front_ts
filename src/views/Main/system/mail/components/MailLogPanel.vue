<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppDialog } from '@/components/AppDialog'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { AppTable } from '@/components/Table'
import { useUserStore } from '@/store/user'
import {
  type MailLogItem,
  type MailLogScene,
  type MailLogStatus,
} from '@/api/system/mail'
import { useMailLogDiagnostics } from './use-mail-log-diagnostics'

interface MailLogSearchForm {
  scene: MailLogScene | ''
  status: MailLogStatus | ''
  to_email: string
  dateRange: string[]
}

const { t } = useI18n()
const userStore = useUserStore()
const searchForm = ref<MailLogSearchForm>({
  scene: '',
  status: '',
  to_email: '',
  dateRange: [],
})
const canViewLogs = computed(() => userStore.can('system_mail_logView'))
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
  batchDel,
  confirmDel,
  dict,
  detail,
  detailLoading,
  detailVisible,
  isActive,
  activate,
  clearDetail,
  clearDiagnostics,
  openDetail,
  refreshLogs,
} = useMailLogDiagnostics({
  canViewLogs,
  searchForm: apiSearchForm,
})

defineExpose({ activate, clearDiagnostics, refreshLogs })

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
  { key: 'verification_code', label: t('mail.log.verificationCode'), width: 150 },
  { key: 'verification_code_status', label: t('mail.log.verificationCodeStatus'), minWidth: 180 },
  { key: 'verification_code_expires_at', label: t('mail.log.verificationCodeExpiry'), width: 180 },
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

function diagnosticStatusLabel(status: MailLogItem['verification_code_status']) {
  if (status === null) return '-'
  return dict.value.mail_verification_code_status_arr.find((item) => item.value === status)?.label ?? '-'
}

async function searchLogs() {
  if (!isActive()) return
  await onSearch()
}

async function changePage(nextPage: Parameters<typeof onPageChange>[0]) {
  if (!isActive()) return
  await onPageChange(nextPage)
}

function clearClosedDetail(visible: boolean) {
  if (!visible) clearDetail()
}
</script>

<template>
  <div class="mail-log">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      :collapse-count="3"
      @query="searchLogs"
      @reset="searchLogs"
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

    <div class="mail-log__table">
      <AppTable
        :columns="columns"
        :data="logs"
        :loading="loading"
        :pagination="page"
        row-key="id"
        selectable
        @selection-change="onSelectionChange"
        @update:pagination="changePage"
        @refresh="refreshLogs"
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

        <template #cell-verification_code="{ row }">
          <span data-testid="diagnostic-code">{{ row.verification_code ?? '-' }}</span>
        </template>

        <template #cell-verification_code_status="{ row }">
          <span data-testid="diagnostic-status">{{ diagnosticStatusLabel(row.verification_code_status) }}</span>
        </template>

        <template #cell-verification_code_expires_at="{ row }">
          <span data-testid="diagnostic-expiry">{{ row.verification_code_expires_at ?? '-' }}</span>
        </template>

        <template #cell-actions="{ row }">
          <el-button
            data-testid="view-mail-log-detail"
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
      :title="t('mail.log.detailTitle')"
      width="760px"
      @update:model-value="clearClosedDetail"
      @closed="clearDetail"
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
          <el-descriptions-item :label="t('mail.log.scene')">
            {{ sceneLabel(detail.scene) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('mail.log.toEmail')">
            {{ detail.to_email }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('mail.log.subject')">
            {{ detail.subject || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('mail.log.status')">
            <el-tag :type="statusType(detail.status)">
              {{ statusLabel(detail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('mail.log.verificationCode')">
            <span data-testid="detail-diagnostic-code">{{ detail.verification_code ?? '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item :label="t('mail.log.verificationCodeStatus')">
            <span data-testid="detail-diagnostic-status">{{ diagnosticStatusLabel(detail.verification_code_status) }}</span>
          </el-descriptions-item>
          <el-descriptions-item :label="t('mail.log.verificationCodeExpiry')">
            <span data-testid="detail-diagnostic-expiry">{{ detail.verification_code_expires_at ?? '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item :label="t('mail.log.duration')">
            {{ detail.duration_ms }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('mail.log.requestId')">
            {{ detail.tencent_request_id || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('mail.log.messageId')">
            {{ detail.tencent_message_id || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('mail.log.errorCode')">
            {{ detail.error_code || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('mail.log.errorMessage')">
            {{ detail.error_message || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('mail.log.sentAt')">
            {{ detail.sent_at || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('mail.common.createdAt')">
            {{ detail.created_at || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-alert
          class="mail-log__notice"
          type="info"
          :closable="false"
          :title="t('mail.log.securityNotice')"
        />
        <el-descriptions
          v-if="detail.template"
          class="mail-log__template"
          :title="t('mail.log.templateTitle')"
          :column="2"
          border
        >
          <el-descriptions-item :label="t('mail.log.templateScene')">
            {{ sceneLabel(detail.template.scene) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('mail.log.templateName')">
            {{ detail.template.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('mail.template.tencentTemplateId')">
            {{ detail.template.tencent_template_id }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('mail.template.variables')">
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
.mail-log {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
  gap: 14px;
}

.mail-log__table {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.mail-log__notice,
.mail-log__template {
  margin-top: 14px;
}
</style>
