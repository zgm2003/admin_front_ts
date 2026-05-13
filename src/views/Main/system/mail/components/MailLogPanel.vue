<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import { useUserStore } from '@/store/user'
import {
  MailApi,
  type MailLogItem,
  type MailLogScene,
  type MailLogStatus,
  type MailPageInitResponse,
} from '@/api/system/mail'

const { t } = useI18n()
const userStore = useUserStore()
const loading = shallowRef(false)
const detailLoading = shallowRef(false)
const detailVisible = shallowRef(false)
const logs = ref<MailLogItem[]>([])
const selectedRows = ref<MailLogItem[]>([])
const detail = ref<MailLogItem | null>(null)
const dateRange = ref<[string, string] | []>([])
const page = reactive({ current_page: 1, page_size: 20, total: 0 })
const filters = reactive({
  scene: '' as MailLogScene | '',
  status: '' as MailLogStatus | '',
  to_email: '',
})
const dict = ref<MailPageInitResponse['dict']>({
  common_status_arr: [],
  mail_scene_arr: [],
  mail_log_scene_arr: [],
  mail_log_status_arr: [],
  default_region: 'ap-guangzhou',
  default_endpoint: 'ses.tencentcloudapi.com',
})

const canDelete = computed(() => userStore.can('system_mail_logDel'))

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

function buildQuery() {
  const [start, end] = dateRange.value
  return {
    current_page: page.current_page,
    page_size: page.page_size,
    scene: filters.scene,
    status: filters.status,
    to_email: filters.to_email,
    created_at_start: start,
    created_at_end: end,
  }
}

async function load() {
  loading.value = true
  try {
    const [initData, listData] = await Promise.all([MailApi.pageInit(), MailApi.logs(buildQuery())])
    dict.value = initData.dict
    logs.value = listData.list
    page.total = listData.page.total
    page.current_page = listData.page.current_page
    page.page_size = listData.page.page_size
  } finally {
    loading.value = false
  }
}

function search() {
  page.current_page = 1
  void load()
}

function reset() {
  filters.scene = ''
  filters.status = ''
  filters.to_email = ''
  dateRange.value = []
  search()
}

function pageChange(currentPage: number) {
  page.current_page = currentPage
  void load()
}

function sizeChange(pageSize: number) {
  page.page_size = pageSize
  page.current_page = 1
  void load()
}

function selectionChange(rows: MailLogItem[]) {
  selectedRows.value = rows
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

async function deleteRows(rows: MailLogItem[]) {
  if (rows.length === 0) {
    ElNotification.warning({ message: t('common.selectAtLeastOne') })
    return
  }
  await ElMessageBox.confirm(t('common.confirmBatchDelete'), t('common.confirmTitle'), { type: 'warning' })
  await MailApi.deleteLogs({ id: rows.map((row) => row.id) })
  ElNotification.success({ message: t('common.success.delete') })
  selectedRows.value = []
  await load()
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="mail-log">
    <el-card shadow="never" class="mail-log__filter">
      <el-form :model="filters" inline>
        <el-form-item :label="t('mail.log.scene')">
          <el-select v-model="filters.scene" clearable class="mail-log__select">
            <el-option v-for="item in dict.mail_log_scene_arr" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('mail.log.status')">
          <el-select v-model="filters.status" clearable class="mail-log__select">
            <el-option v-for="item in dict.mail_log_status_arr" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('mail.log.toEmail')">
          <el-input v-model="filters.to_email" clearable class="mail-log__input" />
        </el-form-item>
        <el-form-item :label="t('mail.log.createdAt')">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            :start-placeholder="t('mail.log.startTime')"
            :end-placeholder="t('mail.log.endTime')"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">{{ t('common.actions.query') }}</el-button>
          <el-button @click="reset">{{ t('common.actions.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="mail-log__toolbar">
      <el-button v-if="canDelete" type="danger" :disabled="selectedRows.length === 0" @click="deleteRows(selectedRows)">
        {{ t('common.actions.batchDelete') }}
      </el-button>
      <el-button @click="load">{{ t('common.actions.refresh') }}</el-button>
    </div>

    <el-table v-loading="loading" :data="logs" border row-key="id" @selection-change="selectionChange">
      <el-table-column type="selection" width="48" />
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column :label="t('mail.log.scene')" min-width="150">
        <template #default="{ row }">
          {{ sceneLabel(row.scene) }}
        </template>
      </el-table-column>
      <el-table-column prop="to_email" :label="t('mail.log.toEmail')" min-width="210" show-overflow-tooltip />
      <el-table-column prop="subject" :label="t('mail.log.subject')" min-width="180" show-overflow-tooltip />
      <el-table-column :label="t('mail.log.status')" width="120">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="error_code" :label="t('mail.log.errorCode')" min-width="180" show-overflow-tooltip />
      <el-table-column prop="duration_ms" :label="t('mail.log.duration')" width="120" />
      <el-table-column prop="created_at" :label="t('mail.log.createdAt')" width="180" />
      <el-table-column :label="t('common.actions.action')" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" text @click="openDetail(row)">{{ t('common.actions.detail') }}</el-button>
          <el-button v-if="canDelete" type="danger" text @click="deleteRows([row])">{{ t('common.actions.del') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="mail-log__pagination">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="page.total"
        :current-page="page.current_page"
        :page-size="page.page_size"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="pageChange"
        @size-change="sizeChange"
      />
    </div>

    <el-dialog v-model="detailVisible" :title="t('mail.log.detailTitle')" width="760px">
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
    </el-dialog>
  </div>
</template>

<style scoped>
.mail-log__filter {
  margin-bottom: 14px;
}

.mail-log__select {
  width: 180px;
}

.mail-log__input {
  width: 220px;
}

.mail-log__toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.mail-log__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
