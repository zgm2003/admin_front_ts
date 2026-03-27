<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import { useTable } from '@/hooks/useTable'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { PayReconcileApi } from '@/api/pay/reconcile'
import { ReconcileStatus } from '@/enums'
import { formatFen } from '@/enums/PayEnum'
import { ElNotification } from 'element-plus'

const userStore = useUserStore()
const { t } = useI18n()
const isMobile = useIsMobile()

// ==================== 下拉字典 ====================
const channelArr = ref<{ label: string; value: number }[]>([])
const reconcileStatusArr = ref<{ label: string; value: number }[]>([])
const billTypeArr = ref<{ label: string; value: number }[]>([])

const init = async () => {
  const data = await PayReconcileApi.init()
  channelArr.value = data.dict.channel_arr
  reconcileStatusArr.value = data.dict.reconcile_status_arr
  billTypeArr.value = data.dict.bill_type_arr
}

// ==================== 搜索 ====================
const searchForm = ref({
  channel: '' as number | '',
  status: '' as number | '',
  bill_type: '' as number | '',
})

const searchFields = computed<SearchField[]>(() => [
  { key: 'channel', type: 'select-v2', label: t('pay_reconcile.table.channel'), options: channelArr.value, width: 130 },
  { key: 'status', type: 'select-v2', label: t('pay_reconcile.table.status'), options: reconcileStatusArr.value, width: 130 },
  { key: 'bill_type', type: 'select-v2', label: t('pay_reconcile.table.bill_type'), options: billTypeArr.value, width: 120 },
])

// ==================== 表格 ====================
const {
  loading: listLoading,
  data: listData,
  page,
  getList,
  onSearch,
  onPageChange,
  refresh,
} = useTable({
  api: PayReconcileApi,
  searchForm,
})

const columns = computed(() => [
  { key: 'reconcile_date', label: t('pay_reconcile.table.reconcile_date'), width: 120 },
  { key: 'channel_text', label: t('pay_reconcile.table.channel') },
  { key: 'bill_type_text', label: t('pay_reconcile.table.bill_type') },
  { key: 'status_text', label: t('pay_reconcile.table.status') },
  { key: 'platform_count', label: t('pay_reconcile.table.platform_count') },
  { key: 'platform_amount', label: t('pay_reconcile.table.platform_amount'), width: 130, formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'local_count', label: t('pay_reconcile.table.local_count') },
  { key: 'local_amount', label: t('pay_reconcile.table.local_amount'), width: 130, formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'diff_count', label: t('pay_reconcile.table.diff_count') },
  { key: 'diff_amount', label: t('pay_reconcile.table.diff_amount'), width: 130, formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'started_at', label: t('pay_reconcile.table.started_at'), width: 180 },
  { key: 'finished_at', label: t('pay_reconcile.table.finished_at'), width: 180 },
  { key: 'actions', label: t('common.actions.action'), width: 100 },
])

// ==================== 状态标签颜色 ====================
const statusType = (val: number) => {
  if (val === ReconcileStatus.SUCCESS) return 'success'
  if (val === ReconcileStatus.DIFF) return 'warning'
  if (val === ReconcileStatus.FAILED) return 'danger'
  if (val === ReconcileStatus.DOWNLOADING || val === ReconcileStatus.COMPARING) return undefined
  return 'info'
}

// ==================== 详情 ====================
const detailVisible = ref(false)
const detailData = ref<any>(null)

const showDetail = async (row: any) => {
  const res = await PayReconcileApi.detail({ id: row.id })
  detailData.value = res
  detailVisible.value = true
}

// ==================== 重试 ====================
const handleRetry = async (row: any) => {
  PayReconcileApi.retry({ id: row.id }).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    void getList()
  })
}

onMounted(() => {
  void init()
  void getList()
})
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
    <div class="table">
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
        <template #cell-status_text="{ row }">
          <el-tag :type="statusType(row.status)">{{ row.status_text }}</el-tag>
        </template>
        <template #cell-diff_count="{ row }">
          <span :style="{ color: row.diff_count > 0 ? '#f56c6c' : '' }">{{ row.diff_count }}</span>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="showDetail(row)">{{ t('common.actions.detail') }}</el-button>
          <el-button
            type="warning"
            text
            v-if="userStore.can('pay_reconcile_retry') && row.status === ReconcileStatus.FAILED"
            @click="handleRetry(row)"
          >
            {{ t('pay_reconcile.actions.retry') }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <!-- 详情弹窗 -->
  <el-dialog v-model="detailVisible" :width="isMobile ? '94vw' : '800px'">
    <template #header>{{ t('pay_reconcile.detail.title') }}</template>
    <el-descriptions v-if="detailData" :column="2" border>
      <el-descriptions-item :label="t('pay_reconcile.table.reconcile_date')">{{ detailData.task.reconcile_date }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_reconcile.table.channel')">{{ detailData.task.channel_text }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_reconcile.table.bill_type')">{{ detailData.task.bill_type_text }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_reconcile.table.status')">
        <el-tag :type="statusType(detailData.task.status)">{{ detailData.task.status_text }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_reconcile.table.platform_count')">{{ detailData.task.platform_count }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_reconcile.table.platform_amount')">¥{{ formatFen(detailData.task.platform_amount) }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_reconcile.table.local_count')">{{ detailData.task.local_count }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_reconcile.table.local_amount')">¥{{ formatFen(detailData.task.local_amount) }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_reconcile.table.diff_count')">
        <span :style="{ color: detailData.task.diff_count > 0 ? '#f56c6c' : '' }">{{ detailData.task.diff_count }}</span>
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_reconcile.table.diff_amount')">¥{{ formatFen(detailData.task.diff_amount) }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_reconcile.table.started_at')">{{ detailData.task.started_at ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_reconcile.table.finished_at')">{{ detailData.task.finished_at ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_reconcile.table.platform_file')">{{ detailData.task.platform_file ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_reconcile.table.local_file')">{{ detailData.task.local_file ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_reconcile.table.diff_file')">{{ detailData.task.diff_file ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_reconcile.table.error_msg')" :span="2">{{ detailData.task.error_msg ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_reconcile.table.created_at')">{{ detailData.task.created_at }}</el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>

<style scoped>
.box {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
</style>
