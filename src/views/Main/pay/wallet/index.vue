<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import { useTable } from '@/hooks/useTable'
import type { PageState } from '@/hooks/useTable'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { UserWalletApi } from '@/api/pay/wallet'
import { WalletType } from '@/enums'
import { formatFen } from '@/enums/PayEnum'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const userStore = useUserStore()
const { t } = useI18n()
const isMobile = useIsMobile()

// ==================== 下拉字典 ====================
const walletTypeArr = ref<{ label: string; value: number }[]>([])

const init = async () => {
  const data = await UserWalletApi.init()
  walletTypeArr.value = data.dict.wallet_type_arr
}

// ==================== 搜索 ====================
const searchForm = ref({
  user_id: '' as number | '',
})

const searchFields = computed<SearchField[]>(() => [
  { key: 'user_id', type: 'input', label: t('pay_wallet.table.user_id'), placeholder: t('pay_wallet.filter.user_id'), width: 150 },
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
  api: UserWalletApi,
  searchForm,
})

const columns = computed(() => [
  { key: 'id', label: 'ID', width: 80 },
  { key: 'user_id', label: t('pay_wallet.table.user_id'), width: 120 },
  { key: 'balance', label: t('pay_wallet.table.balance'), width: 140, formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'frozen', label: t('pay_wallet.table.frozen'), width: 120, formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'available', label: t('pay_wallet.table.available'), width: 140, formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'total_recharge', label: t('pay_wallet.table.total_recharge'), width: 140, formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'total_consume', label: t('pay_wallet.table.total_consume'), width: 140, formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'total_refund', label: t('pay_wallet.table.total_refund'), width: 140, formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'created_at', label: t('pay_wallet.table.created_at'), width: 180 },
  { key: 'actions', label: t('common.actions.action'), width: 100 },
])

// ==================== 钱包流水 ====================
const txColumns = computed(() => [
  { key: 'id', label: 'ID', width: 80 },
  { key: 'biz_action_no', label: t('pay_wallet.txn.table.biz_action_no'), width: 220 },
  { key: 'type_text', label: t('pay_wallet.txn.table.type'), width: 120 },
  { key: 'available_delta', label: t('pay_wallet.txn.table.available_delta'), width: 130, formatter: (_r: any, _c: any, v: number) => `${v >= 0 ? '+' : ''}¥${formatFen(Math.abs(v))}` },
  { key: 'frozen_delta', label: t('pay_wallet.txn.table.frozen_delta'), width: 130, formatter: (_r: any, _c: any, v: number) => `${v >= 0 ? '+' : ''}¥${formatFen(Math.abs(v))}` },
  { key: 'balance_before', label: t('pay_wallet.txn.table.balance_before'), width: 130, formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'balance_after', label: t('pay_wallet.txn.table.balance_after'), width: 130, formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'order_no', label: t('pay_wallet.txn.table.order_no'), width: 200 },
  { key: 'title', label: t('pay_wallet.txn.table.title') },
  { key: 'created_at', label: t('pay_wallet.txn.table.created_at'), width: 180 },
])

const txSearchForm = ref({
  user_id: '' as number | '',
  type: '' as number | '',
})
const txSearchFields = computed<SearchField[]>(() => [
  { key: 'user_id', type: 'input', label: t('pay_wallet.table.user_id'), placeholder: t('pay_wallet.filter.user_id'), width: 150 },
  { key: 'type', type: 'select-v2', label: t('pay_wallet.txn.table.type'), options: walletTypeArr.value, width: 130 },
])

const walletTransactionTableApi = {
  list: (params: Record<string, unknown>) => UserWalletApi.transactions(params),
}

const {
  loading: txLoading,
  data: txData,
  page: txPage,
  onSearch: txOnSearch,
  onPageChange: txOnPageChange,
} = useTable({
  api: walletTransactionTableApi,
  searchForm: txSearchForm,
})

const txDialogVisible = ref(false)
const openTransactions = async (row: any) => {
  txSearchForm.value.user_id = row.user_id
  txDialogVisible.value = true
  await txOnSearch()
}

// ==================== 调账 ====================
const adjustFormRef = ref<FormInstance | null>(null)
const adjustVisible = ref(false)
const adjustForm = ref({ user_id: 0 as number, delta: 0 as number, reason: '' })

const adjustRules = computed<FormRules>(() => ({
  user_id: [{ required: true, message: t('pay_wallet.form.user_id') + t('common.required'), trigger: 'blur' }],
  delta: [{ required: true, message: t('pay_wallet.form.delta') + t('common.required'), trigger: 'blur' }],
}))

const openAdjust = (row?: any) => {
  adjustForm.value = { user_id: row ? row.user_id : 0, delta: 0, reason: '' }
  adjustVisible.value = true
  nextTick(() => { void adjustFormRef.value?.clearValidate() })
}

const confirmAdjust = async () => {
  try { await adjustFormRef.value?.validate() } catch { return }
  UserWalletApi.adjust({
    user_id: adjustForm.value.user_id,
    delta: Math.round(adjustForm.value.delta * 100),
    reason: adjustForm.value.reason,
  }).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    adjustVisible.value = false
    void getList()
  })
}

// ==================== 状态标签颜色 ====================
const walletTypeTag = (val: number) => {
  if (val === WalletType.RECHARGE || val === WalletType.REFUND || val === WalletType.UNFREEZE) return 'success'
  if (val === WalletType.CONSUME || val === WalletType.FREEZE) return 'warning'
  if (val === WalletType.ADJUST) return 'info'
  return undefined
}

const txGoToPage = (currentPage: number) => {
  txOnPageChange({
    ...txPage.value,
    current_page: currentPage,
  } as PageState)
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
          <el-button v-if="userStore.can('pay_wallet_adjust')" type="warning" @click="openAdjust()">
            {{ t('pay_wallet.actions.adjust') }}
          </el-button>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="openTransactions(row)">{{ t('pay_wallet.actions.transactions') }}</el-button>
          <el-button type="warning" text v-if="userStore.can('pay_wallet_adjust')" @click="openAdjust(row)">
            {{ t('pay_wallet.actions.adjust') }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <!-- 钱包流水弹窗 -->
  <el-dialog v-model="txDialogVisible" :width="isMobile ? '94vw' : '1100px'" :title="t('pay_wallet.txn.title')">
    <Search v-model="txSearchForm" :fields="txSearchFields" @query="txOnSearch" @reset="txOnSearch" />
    <el-table :data="txData" :loading="txLoading" size="small" style="margin-top:12px" :max-height="480">
      <el-table-column v-for="col in txColumns" :key="col.key" :prop="col.key" :label="col.label" :width="col.width">
        <template v-if="col.key === 'available_delta'" #default="{ row }">
          <span :style="{ color: row.available_delta >= 0 ? '#67c23a' : '#f56c6c' }">
            {{ row.available_delta >= 0 ? '+' : '' }}¥{{ formatFen(Math.abs(row.available_delta)) }}
          </span>
        </template>
        <template v-if="col.key === 'frozen_delta'" #default="{ row }">
          <span :style="{ color: row.frozen_delta >= 0 ? '#67c23a' : '#f56c6c' }">
            {{ row.frozen_delta >= 0 ? '+' : '' }}¥{{ formatFen(Math.abs(row.frozen_delta)) }}
          </span>
        </template>
        <template v-if="col.key === 'type_text'" #default="{ row }">
          <el-tag :type="walletTypeTag(row.type)" size="small">{{ row.type_text }}</el-tag>
        </template>
        <template v-if="col.key === 'balance_before' || col.key === 'balance_after'" #default="{ row }">
          ¥{{ formatFen(row[col.key]) }}
        </template>
      </el-table-column>
    </el-table>
    <div style="margin-top:12px;display:flex;justify-content:flex-end">
      <el-pagination
        :current-page="txPage.current_page"
        :page-size="txPage.page_size"
        :total="txPage.total"
        layout="total, prev, pager, next"
        @current-change="txGoToPage"
      />
    </div>
  </el-dialog>

  <!-- 调账弹窗 -->
  <el-dialog v-model="adjustVisible" :width="isMobile ? '94vw' : '480px'" :title="t('pay_wallet.actions.adjust')">
    <el-form :model="adjustForm" :rules="adjustRules" ref="adjustFormRef" label-width="auto">
      <el-form-item :label="t('pay_wallet.form.user_id')" prop="user_id" required>
        <el-input-number v-model="adjustForm.user_id" :min="1" style="width:100%" />
      </el-form-item>
      <el-form-item :label="t('pay_wallet.form.delta')" prop="delta" required>
        <el-input-number v-model="adjustForm.delta" :precision="2" :step="1" style="width:100%" />
        <div style="color:#909399;font-size:12px;margin-top:4px">输入元，正数为增加，负数为扣除</div>
      </el-form-item>
      <el-form-item :label="t('pay_wallet.form.reason')">
        <el-input v-model="adjustForm.reason" type="textarea" :rows="3" clearable style="width:100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="adjustVisible = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="confirmAdjust">{{ t('common.actions.confirm') }}</el-button>
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
