<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import { useTable } from '@/hooks/useTable'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { OrderApi } from '@/api/pay/order'
import { PayStatus, BizStatus, RefundStatus } from '@/enums'
import { formatFen } from '@/enums/PayEnum'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const userStore = useUserStore()
const { t } = useI18n()
const isMobile = useIsMobile()

// ==================== 下拉字典 ====================
const orderTypeArr = ref<{ label: string; value: number }[]>([])
const payStatusArr = ref<{ label: string; value: number }[]>([])

const init = async () => {
  const data = await OrderApi.init()
  orderTypeArr.value = data.dict.order_type_arr
  payStatusArr.value = data.dict.pay_status_arr
}

// ==================== 状态统计 ====================
const statusCounts = ref<Record<number, { label: string; count: number }>>({})
const activeStatusTab = ref('all')

const loadStatusCount = async () => {
  const res = await OrderApi.statusCount()
  statusCounts.value = res.counts
}

const statusTabs = computed(() => [
  {
    label: t('pay_order.tabs.all'),
    value: 'all',
  },
  ...payStatusArr.value.map((item) => ({
    label: `${item.label} (${statusCounts.value[item.value]?.count ?? 0})`,
    value: String(item.value),
  })),
])

// ==================== 搜索 ====================
const searchForm = ref({
  order_no: '',
  user_id: '' as number | '',
  order_type: '' as number | '',
  pay_status: '' as number | '',
})

const searchFields = computed<SearchField[]>(() => [
  { key: 'order_no', type: 'input', label: t('pay_order.table.order_no'), placeholder: t('pay_order.filter.order_no'), width: 180 },
  { key: 'user_id', type: 'input', label: t('pay_order.table.user_id'), placeholder: t('pay_order.filter.user_id'), width: 120 },
  { key: 'order_type', type: 'select-v2', label: t('pay_order.table.order_type'), options: orderTypeArr.value, width: 130 },
  { key: 'pay_status', type: 'select-v2', label: t('pay_order.table.pay_status'), options: payStatusArr.value, width: 130 },
])

// ==================== 表格 ====================
const {
  loading: listLoading,
  data: listData,
  page,
  onSearch,
  onPageChange,
  refresh,
  getList,
} = useTable({
  api: OrderApi,
  searchForm,
})

const columns = computed(() => [
  { key: 'order_no', label: t('pay_order.table.order_no'), width: 220 },
  { key: 'order_type_text', label: t('pay_order.table.order_type') },
  { key: 'title', label: t('pay_order.table.title') },
  { key: 'pay_amount', label: t('pay_order.table.pay_amount'), width: 120, formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'pay_status_text', label: t('pay_order.table.pay_status') ,width: 150 },
  { key: 'biz_status_text', label: t('pay_order.table.biz_status') ,width: 150 },
  { key: 'refund_status_text', label: t('pay_order.table.refund_status') ,width: 150 },
  { key: 'pay_time', label: t('pay_order.table.pay_time'), width: 180 },
  { key: 'created_at', label: t('pay_order.table.created_at'), width: 180 },
  { key: 'actions', label: t('common.actions.action'), width: 280 },
])

const onTabChange = (status: string | number) => {
  const nextStatus = String(status)
  activeStatusTab.value = nextStatus
  searchForm.value.pay_status = nextStatus === 'all' ? '' : Number(nextStatus)
  void onSearch()
}

// ==================== 详情 ====================
const detailVisible = ref(false)
const detailData = ref<any>(null)

const showDetail = async (row: any) => {
  const res = await OrderApi.detail({ id: row.id })
  detailData.value = res
  detailVisible.value = true
}

// ==================== 关闭订单 ====================
const closeFormRef = ref<FormInstance | null>(null)
const closeVisible = ref(false)
const closeForm = ref({ id: 0, reason: '' })
const closeRules = computed<FormRules>(() => ({
  reason: [
    { required: true, message: t('pay_order.table.close_reason') + t('common.required'), trigger: 'blur' },
    { max: 100, message: t('pay_order.table.close_reason') + '，最大长度100', trigger: 'blur' },
  ],
}))

const openClose = (row: any) => {
  closeForm.value = { id: row.id, reason: '' }
  closeVisible.value = true
  nextTick(() => { void closeFormRef.value?.clearValidate() })
}

const confirmClose = async () => {
  try { await closeFormRef.value?.validate() } catch { return }
  OrderApi.close({ id: closeForm.value.id, reason: closeForm.value.reason }).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    closeVisible.value = false
    void loadStatusCount()
    void getList()
  })
}

// ==================== 备注 ====================
const remarkFormRef = ref<FormInstance | null>(null)
const remarkVisible = ref(false)
const remarkForm = ref({ id: 0, admin_remark: '' })

const openRemark = (row: any) => {
  remarkForm.value = { id: row.id, admin_remark: row.admin_remark ?? '' }
  remarkVisible.value = true
  nextTick(() => { void remarkFormRef.value?.clearValidate() })
}

const confirmRemark = async () => {
  try { await remarkFormRef.value?.validate() } catch { return }
  OrderApi.remark({ id: remarkForm.value.id, remark: remarkForm.value.admin_remark }).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    remarkVisible.value = false
    void getList()
  })
}

// ==================== 状态标签颜色 ====================
const payStatusType = (val: number) => {
  if (val === PayStatus.PAID) return 'success'
  if (val === PayStatus.CLOSED) return 'info'
  if (val === PayStatus.EXCEPTION) return 'danger'
  return 'warning'
}
const bizStatusType = (val: number) => {
  if (val === BizStatus.SUCCESS) return 'success'
  if (val === BizStatus.FAILED) return 'danger'
  if (val === BizStatus.MANUAL) return 'warning'
  if (val === BizStatus.EXECUTING) return 'primary'
  return 'info'
}
const refundStatusType = (val: number) => {
  if (val === RefundStatus.FULL) return 'success'
  if (val === RefundStatus.NONE) return 'info'
  if (val === RefundStatus.EXCEPTION) return 'danger'
  if (val === RefundStatus.ING) return 'warning'
  return 'info'
}

onMounted(() => {
  void init()
  void loadStatusCount()
  void getList()
})
</script>

<template>
  <div class="box">
    <el-tabs v-model="activeStatusTab" :stretch="isMobile" class="status-tabs" @tab-change="onTabChange">
      <el-tab-pane
        v-for="tab in statusTabs"
        :key="tab.value"
        :label="tab.label"
        :name="tab.value"
      />
    </el-tabs>

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
        <template #cell-pay_status_text="{ row }">
          <el-tag :type="payStatusType(row.pay_status)">{{ row.pay_status_text }}</el-tag>
        </template>
        <template #cell-biz_status_text="{ row }">
          <el-tag :type="bizStatusType(row.biz_status)">{{ row.biz_status_text }}</el-tag>
        </template>
        <template #cell-refund_status_text="{ row }">
          <el-tag :type="refundStatusType(row.refund_status)">{{ row.refund_status_text }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="showDetail(row)">{{ t('common.actions.detail') }}</el-button>
          <el-button
            type="danger"
            text
            v-if="userStore.can('pay_order_edit')"
            @click="openClose(row)"
            :disabled="row.pay_status !== PayStatus.PENDING && row.pay_status !== PayStatus.PAYING"
          >
            {{ t('pay_order.actions.close') }}
          </el-button>
          <el-button type="warning" text v-if="userStore.can('pay_order_edit')" @click="openRemark(row)">
            {{ t('pay_order.actions.remark') }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <!-- 详情弹窗 -->
  <el-dialog v-model="detailVisible" :width="isMobile ? '94vw' : '860px'" :title="t('pay_order.detail.title')">
    <template v-if="detailData">
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="t('pay_order.table.order_no')">{{ detailData.order.order_no }}</el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.order_type')">{{ detailData.order.order_type_text }}</el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.pay_amount')">¥{{ formatFen(detailData.order.pay_amount) }}</el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.refunded_amount')">¥{{ formatFen(detailData.order.refunded_amount) }}</el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.pay_status')">
          <el-tag :type="payStatusType(detailData.order.pay_status)">{{ detailData.order.pay_status_text }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.biz_status')">
          <el-tag :type="bizStatusType(detailData.order.biz_status)">{{ detailData.order.biz_status_text }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.refund_status')">
          <el-tag :type="refundStatusType(detailData.order.refund_status)">{{ detailData.order.refund_status_text }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.channel')">{{ detailData.order.channel?.name ?? '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.pay_method')">{{ detailData.order.pay_method ?? '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.pay_time')">{{ detailData.order.pay_time ?? '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.expire_time')">{{ detailData.order.expire_time ?? '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.close_time')">{{ detailData.order.close_time ?? '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.close_reason')" :span="2">{{ detailData.order.close_reason ?? '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.admin_remark')" :span="2">{{ detailData.order.admin_remark ?? '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.created_at')">{{ detailData.order.created_at }}</el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.biz_done_at')">{{ detailData.order.biz_done_at ?? '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>{{ t('pay_order.detail.items') }}</el-divider>
      <el-table :data="detailData.items" border size="small">
        <el-table-column prop="title" :label="t('pay_order.detail.item_title')" />
        <el-table-column prop="price" :label="t('pay_order.detail.item_price')" width="140" :formatter="(_r:any,_c:any,v:number) => `¥${formatFen(v)}`" />
        <el-table-column prop="quantity" :label="t('pay_order.detail.item_qty')" width="100" />
        <el-table-column prop="amount" :label="t('pay_order.detail.item_amount')" width="140" :formatter="(_r:any,_c:any,v:number) => `¥${formatFen(v)}`" />
      </el-table>
    </template>
  </el-dialog>

  <!-- 关闭订单弹窗 -->
  <el-dialog v-model="closeVisible" :width="isMobile ? '94vw' : '480px'" :title="t('pay_order.actions.close')">
    <el-form :model="closeForm" :rules="closeRules" ref="closeFormRef" label-width="auto">
      <el-form-item :label="t('pay_order.table.close_reason')" prop="reason" required>
        <el-input v-model="closeForm.reason" type="textarea" :rows="3" clearable style="width:100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeVisible = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="confirmClose">{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 备注弹窗 -->
  <el-dialog v-model="remarkVisible" :width="isMobile ? '94vw' : '540px'" :title="t('pay_order.actions.remark')">
    <el-form :model="remarkForm" ref="remarkFormRef" label-width="auto">
      <el-form-item :label="t('pay_order.table.admin_remark')">
        <el-input v-model="remarkForm.admin_remark" type="textarea" :rows="4" clearable style="width:100%" maxlength="500" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="remarkVisible = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="confirmRemark">{{ t('common.actions.confirm') }}</el-button>
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
.status-tabs {
  margin-bottom: 12px;
}
.table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
</style>
