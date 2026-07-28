<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Ticket } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { Search } from '@/components/Search'
import { AppTable } from '@/components/Table'
import { useTable } from '@/components/Table'
import { WalletApi, type WalletDirection, type WalletRedemptionResponse, type WalletSourceType, type WalletSummaryResponse, type WalletTransactionItem, type WalletTransactionListParams } from '@/api/wallet'
import type { SearchField, SearchFormModel } from '@/components/Search/types'
import type { DictOption } from '@/types/common'
import RedeemCodeDialog from './components/RedeemCodeDialog.vue'

type WalletTransactionSearchForm = WalletTransactionListParams & SearchFormModel & {
  dateRange: string[]
}

const { t } = useI18n()
const router = useRouter()
const activeTab = shallowRef('wallet')
const redeemDialogVisible = ref(false)
const summary = ref<WalletSummaryResponse>(emptySummary())
const searchForm = ref<WalletTransactionSearchForm>({
  current_page: 1,
  page_size: 20,
  keyword: '',
  direction: '',
  source_type: '',
  date_start: '',
  date_end: '',
  dateRange: [],
})

const apiSearchForm = computed<WalletTransactionListParams>(() => {
  const [dateStart, dateEnd] = searchForm.value.dateRange
  return {
    current_page: searchForm.value.current_page,
    page_size: searchForm.value.page_size,
    keyword: searchForm.value.keyword,
    direction: searchForm.value.direction,
    source_type: searchForm.value.source_type,
    date_start: dateStart || '',
    date_end: dateEnd || '',
  }
})

const transactionApi = { list: WalletApi.transactions }
const { loading, data, page, onPageChange, refresh, resetPage, getList } = useTable<WalletTransactionItem, WalletTransactionListParams>({
  api: transactionApi,
  searchForm: apiSearchForm,
})

const summaryCards = computed(() => [
  { key: 'balance', label: t('wallet.balance'), value: summary.value.balance },
  { key: 'availableBalance', label: t('wallet.availableBalance'), value: summary.value.available_balance },
  { key: 'heldAmount', label: t('wallet.heldAmount'), value: summary.value.held_amount },
  { key: 'totalRecharge', label: t('wallet.totalRecharge'), value: summary.value.total_recharge },
  { key: 'totalConsume', label: t('wallet.totalConsume'), value: summary.value.total_consume },
])

const directionOptions = computed<DictOption<WalletDirection>[]>(() => [
  { label: t('wallet.directionIn'), value: 'in' },
  { label: t('wallet.directionOut'), value: 'out' },
])

const sourceTypeOptions = computed<DictOption<WalletSourceType>[]>(() => [
  { label: t('wallet.sourceRecharge'), value: 'recharge' },
  { label: t('wallet.sourceRedeemCode'), value: 'redeem_code' },
  { label: t('wallet.sourceAiGenerate'), value: 'ai_generate' },
])

const searchFields = computed<SearchField[]>(() => [
  { key: 'keyword', type: 'input', label: t('wallet.keyword'), placeholder: t('wallet.keywordPlaceholder'), width: 210 },
  { key: 'direction', type: 'select-v2', label: t('wallet.direction'), placeholder: t('wallet.direction'), width: 130, options: directionOptions.value },
  { key: 'source_type', type: 'select-v2', label: t('wallet.sourceType'), placeholder: t('wallet.sourceType'), options: sourceTypeOptions.value },
  { key: 'dateRange', type: 'date-range', label: t('wallet.dateRange'), width: 260 },
])

const columns = computed(() => [
  { key: 'transaction_no', label: t('wallet.transactionNo'), minWidth: 190 },
  { key: 'direction_text', label: t('wallet.direction'), width: 100 },
  { key: 'amount', label: t('wallet.amount'), width: 130 },
  { key: 'balance_before', label: t('wallet.balanceBefore'), minWidth: 150 },
  { key: 'balance_after', label: t('wallet.balanceAfter'), minWidth: 150 },
  { key: 'source_type_text', label: t('wallet.sourceType'), minWidth: 220 },
  { key: 'remark', label: t('wallet.remark'), minWidth: 160 },
  { key: 'created_at', label: t('wallet.createdAt'), minWidth: 170 },
])

function onSearch() {
  resetPage()
  void getList()
}

function tagType(direction: WalletDirection) {
  return direction === 'in' ? 'success' : 'warning'
}

function goRecharge() {
  void router.push({ path: '/payment/recharge' })
}

function openRedeemDialog() {
  redeemDialogVisible.value = true
}

async function onRedeemed(result: WalletRedemptionResponse) {
  summary.value = result.wallet
  ElMessage.success(t('wallet.redeem.messages.success', { amount: result.amount }))

  const refreshResults = await Promise.allSettled([
    Promise.resolve().then(() => WalletApi.summary()),
    Promise.resolve().then(() => getList()),
  ])
  const [summaryResult] = refreshResults
  if (summaryResult?.status === 'fulfilled') summary.value = summaryResult.value
  if (refreshResults.some(({ status }) => status === 'rejected')) {
    ElMessage.warning(t('wallet.redeem.messages.partialRefresh'))
  }
}

async function refreshAll() {
  summary.value = await WalletApi.summary()
  await getList()
}

onMounted(() => {
  void refreshAll()
})

function emptySummary(): WalletSummaryResponse {
  return {
    available_balance: '0',
    balance: '0',
    held_amount: '0',
    total_consume: '0',
    total_recharge: '0',
  }
}
</script>

<template>
  <div class="personal-wallet-page">
    <el-tabs
      v-model="activeTab"
      class="personal-wallet-page__tabs"
    >
      <el-tab-pane
        :label="t('wallet.summary')"
        name="wallet"
      >
        <section class="personal-wallet-page__summary">
          <div
            v-for="item in summaryCards"
            :key="item.key"
            class="personal-wallet-page__summary-card"
          >
            <span>{{ item.label }}</span>
            <strong>¥{{ item.value }}</strong>
          </div>
        </section>
        <div class="personal-wallet-page__actions">
          <el-button
            type="primary"
            @click="goRecharge"
          >
            {{ t('wallet.recharge') }}
          </el-button>
          <el-button
            data-test="open-redeem-code"
            :icon="Ticket"
            @click="openRedeemDialog"
          >
            {{ t('wallet.redeem.action') }}
          </el-button>
        </div>
      </el-tab-pane>
      <el-tab-pane
        :label="t('wallet.fundsDetail')"
        name="transactions"
      >
        <section class="personal-wallet-page__transactions">
          <Search
            v-model="searchForm"
            :fields="searchFields"
            :collapse-count="2"
            @query="onSearch"
            @reset="onSearch"
          />

          <div class="personal-wallet-page__table">
            <AppTable
              :columns="columns"
              :data="data"
              :loading="loading"
              :pagination="page"
              @refresh="refresh"
              @update:pagination="onPageChange"
            >
              <template #cell-direction_text="{ row }">
                <el-tag
                  :type="tagType(row.direction)"
                  effect="light"
                >
                  {{ row.direction_text }}
                </el-tag>
              </template>
              <template #cell-amount="{ row }">
                <span>¥{{ row.amount }}</span>
              </template>
              <template #cell-balance_before="{ row }">
                <span>¥{{ row.balance_before }}</span>
              </template>
              <template #cell-balance_after="{ row }">
                <span>¥{{ row.balance_after }}</span>
              </template>
              <template #cell-source_type_text="{ row }">
                <div
                  v-if="row.source_type === 'ai_generate'"
                  class="personal-wallet-page__source"
                >
                  <strong>Run #{{ row.source_id }}</strong>
                  <span>{{ row.remark }}</span>
                </div>
                <span v-else>{{ row.source_type_text }}</span>
              </template>
            </AppTable>
          </div>
        </section>
      </el-tab-pane>
    </el-tabs>

    <RedeemCodeDialog
      v-model="redeemDialogVisible"
      @redeemed="onRedeemed"
    />
  </div>
</template>

<style scoped>
.personal-wallet-page,
.personal-wallet-page__tabs,
.personal-wallet-page__transactions {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.personal-wallet-page__tabs :deep(.el-tabs__header) {
  flex-shrink: 0;
}

.personal-wallet-page__tabs :deep(.el-tabs__content) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.personal-wallet-page__tabs :deep(.el-tab-pane) {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.personal-wallet-page__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.personal-wallet-page__summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.personal-wallet-page__summary-card span {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.personal-wallet-page__summary-card strong {
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 700;
}

.personal-wallet-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.personal-wallet-page__table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.personal-wallet-page__source {
  display: flex;
  flex-direction: column;
  gap: 2px;
  white-space: normal;
}

.personal-wallet-page__source span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

@media (max-width: 768px) {
  .personal-wallet-page__summary {
    grid-template-columns: 1fr;
  }
}
</style>
