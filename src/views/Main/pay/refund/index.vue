<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import { useTable } from '@/hooks/useTable'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { PayRefundApi } from '@/api/pay/refund'
import { RefundRecordStatus } from '@/enums'
import { formatFen } from '@/enums/PayEnum'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const userStore = useUserStore()
const { t } = useI18n()
const isMobile = useIsMobile()

// ==================== 下拉字典 ====================
const channelArr = ref<{ label: string; value: number }[]>([])
const refundStatusArr = ref<{ label: string; value: number }[]>([])

const init = async () => {
  const data = await PayRefundApi.init()
  channelArr.value = data.dict.channel_arr
  refundStatusArr.value = data.dict.refund_record_status_arr
}

// ==================== 搜索 ====================
const searchForm = ref({
  refund_no: '',
  order_no: '',
  status: '' as number | '',
})

const searchFields = computed<SearchField[]>(() => [
  { key: 'refund_no', type: 'input', label: t('pay_refund.table.refund_no'), placeholder: t('pay_refund.filter.refund_no'), width: 200 },
  { key: 'order_no', type: 'input', label: t('pay_refund.table.order_no'), placeholder: t('pay_refund.filter.order_no'), width: 200 },
  { key: 'status', type: 'select-v2', label: t('pay_refund.table.status'), options: refundStatusArr.value, width: 130 },
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
  api: PayRefundApi,
  searchForm,
})

const columns = computed(() => [
  { key: 'id', label: 'ID', width: 80 },
  { key: 'refund_no', label: t('pay_refund.table.refund_no'), width: 220 },
  { key: 'order_no', label: t('pay_refund.table.order_no'), width: 220 },
  { key: 'channel_text', label: t('pay_refund.table.channel'), width: 100 },
  { key: 'refund_amount', label: t('pay_refund.table.refund_amount'), width: 120, formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'status_text', label: t('pay_refund.table.status'), width: 110 },
  { key: 'reason', label: t('pay_refund.table.reason') },
  { key: 'refunded_at', label: t('pay_refund.table.refunded_at'), width: 180 },
  { key: 'created_at', label: t('pay_refund.table.created_at'), width: 180 },
  { key: 'actions', label: t('common.actions.action'), width: 100 },
])

// ==================== 状态标签颜色 ====================
const statusType = (val: number) => {
  if (val === RefundRecordStatus.SUCCESS) return 'success'
  if (val === RefundRecordStatus.FAILED) return 'danger'
  if (val === RefundRecordStatus.ING) return 'warning'
  if (val === RefundRecordStatus.CLOSED) return 'info'
  if (val === RefundRecordStatus.MANUAL) return 'warning'
  return undefined
}

// ==================== 详情 ====================
const detailVisible = ref(false)
const detailData = ref<any>(null)

const showDetail = async (row: any) => {
  const res = await PayRefundApi.detail({ id: row.id })
  detailData.value = res
  detailVisible.value = true
}

// ==================== 申请退款 ====================
const applyFormRef = ref<FormInstance | null>(null)
const applyVisible = ref(false)
const applyForm = ref({ order_id: 0 as number, transaction_id: 0 as number, refund_amount: 0 as number, reason: '' })

const applyRules = computed<FormRules>(() => ({
  order_id: [{ required: true, message: t('pay_refund.form.order_id') + t('common.required'), trigger: 'blur' }],
  refund_amount: [{ required: true, message: t('pay_refund.form.refund_amount') + t('common.required'), trigger: 'blur' }],
}))

const openApply = () => {
  applyForm.value = { order_id: 0, transaction_id: 0, refund_amount: 0, reason: '' }
  applyVisible.value = true
  nextTick(() => { void applyFormRef.value?.clearValidate() })
}

const confirmApply = async () => {
  try { await applyFormRef.value?.validate() } catch { return }
  const payload: any = {
    order_id: applyForm.value.order_id,
    refund_amount: Math.round(applyForm.value.refund_amount * 100),
    reason: applyForm.value.reason,
  }
  if (applyForm.value.transaction_id) {
    payload.transaction_id = applyForm.value.transaction_id
  }
  PayRefundApi.apply(payload).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    applyVisible.value = false
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
        <template #toolbar-left>
          <el-button v-if="userStore.can('pay_refund_apply')" type="success" @click="openApply">
            {{ t('pay_refund.actions.apply') }}
          </el-button>
        </template>
        <template #cell-status_text="{ row }">
          <el-tag :type="statusType(row.status)">{{ row.status_text }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="showDetail(row)">{{ t('common.actions.detail') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <!-- 详情弹窗 -->
  <el-dialog v-model="detailVisible" :width="isMobile ? '94vw' : '800px'">
    <template #header>{{ t('pay_refund.detail.title') }}</template>
    <el-descriptions v-if="detailData" :column="2" border>
      <el-descriptions-item :label="t('pay_refund.table.refund_no')">{{ detailData.refund.refund_no }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_refund.table.order_no')">{{ detailData.refund.order_no }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_refund.table.channel')">{{ detailData.refund.channel_text }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_refund.table.refund_amount')">¥{{ formatFen(detailData.refund.refund_amount) }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_refund.table.wallet_freeze_amount')">¥{{ formatFen(detailData.refund.wallet_freeze_amount) }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_refund.table.trade_refund_no')">{{ detailData.refund.trade_refund_no ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_refund.table.status')">
        <el-tag :type="statusType(detailData.refund.status)">{{ detailData.refund.status_text }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_refund.table.fail_reason')">{{ detailData.refund.fail_reason ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_refund.table.reason')">{{ detailData.refund.reason ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_refund.table.frozen_at')">{{ detailData.refund.frozen_at ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_refund.table.refunded_at')">{{ detailData.refund.refunded_at ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_refund.table.created_at')">{{ detailData.refund.created_at }}</el-descriptions-item>
      <el-descriptions-item v-if="detailData.order" :label="t('pay_refund.detail.order')" :span="2">
        {{ detailData.order.order_no }} | ¥{{ formatFen(detailData.order.pay_amount) }}
      </el-descriptions-item>
      <el-descriptions-item v-if="detailData.refund.raw_request && Object.keys(detailData.refund.raw_request).length" :label="t('pay_refund.detail.raw_request')" :span="2">
        <el-input type="textarea" :rows="3" :model-value="JSON.stringify(detailData.refund.raw_request, null, 2)" readonly />
      </el-descriptions-item>
      <el-descriptions-item v-if="detailData.refund.raw_notify && Object.keys(detailData.refund.raw_notify).length" :label="t('pay_refund.detail.raw_notify')" :span="2">
        <el-input type="textarea" :rows="3" :model-value="JSON.stringify(detailData.refund.raw_notify, null, 2)" readonly />
      </el-descriptions-item>
    </el-descriptions>
  </el-dialog>

  <!-- 申请退款弹窗 -->
  <el-dialog v-model="applyVisible" :width="isMobile ? '94vw' : '520px'" :title="t('pay_refund.actions.apply')">
    <el-form :model="applyForm" :rules="applyRules" ref="applyFormRef" label-width="auto">
      <el-form-item :label="t('pay_refund.form.order_id')" prop="order_id" required>
        <el-input-number v-model="applyForm.order_id" :min="1" style="width:100%" />
      </el-form-item>
      <el-form-item :label="t('pay_refund.form.transaction_id')">
        <el-input-number v-model="applyForm.transaction_id" :min="0" style="width:100%" placeholder="留空则自动使用成功交易" />
      </el-form-item>
      <el-form-item :label="t('pay_refund.form.refund_amount')" prop="refund_amount" required>
        <el-input-number v-model="applyForm.refund_amount" :min="0.01" :precision="2" :step="1" style="width:100%" />
        <span style="color:#909399;font-size:12px;margin-top:4px">输入元，自动转为分</span>
      </el-form-item>
      <el-form-item :label="t('pay_refund.form.reason')">
        <el-input v-model="applyForm.reason" type="textarea" :rows="3" clearable style="width:100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="applyVisible = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="confirmApply">{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
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
