<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CopyDocument, Delete, Download, Link, Plus, Search as SearchIcon } from '@element-plus/icons-vue'
import { Search } from '@/components/Search'
import { AppTable } from '@/components/Table'
import type { SearchField } from '@/components/Search/types'
import type { TableColumn } from '@/components/Table/src/types'
import { useCopy } from '@/hooks/useCopy'
import RedeemCodeGenerateDialog from './components/RedeemCodeGenerateDialog.vue'
import {
  useRedeemCodePage,
  type RedeemCodeItem,
  type RedeemCodeSearchForm,
} from './composables/useRedeemCodePage'

const { t } = useI18n()
const { copy } = useCopy()
const generateDialogVisible = ref(false)
const {
  loading,
  page,
  onPageChange,
  onSelectionChange,
  refresh,
  selectedIds,
  pageLoading,
  generating,
  exporting,
  lookupLoading,
  voiding,
  stateOptions,
  searchForm,
  lookupInput,
  lookupActive,
  displayedData,
  canGenerate,
  canVoid,
  hasPendingGeneration,
  generateBatch,
  abandonPendingGeneration,
  lookup,
  clearLookup,
  onSearch,
  exportCodes,
  exportBatch,
  canVoidRow,
  voidRows,
  voidSelected,
  goToLedger,
} = useRedeemCodePage()

const searchFields = computed<SearchField<RedeemCodeSearchForm>[]>(() => [
  {
    key: 'batch_no',
    type: 'input',
    label: t('paymentRedeemCode.filters.batchNo'),
    placeholder: t('paymentRedeemCode.filters.batchNoPlaceholder'),
    width: 190,
  },
  {
    key: 'state',
    type: 'select-v2',
    label: t('paymentRedeemCode.filters.state'),
    placeholder: t('paymentRedeemCode.filters.state'),
    width: 130,
    options: stateOptions.value,
  },
  {
    key: 'used_user',
    type: 'input',
    label: t('paymentRedeemCode.filters.usedUser'),
    placeholder: t('paymentRedeemCode.filters.usedUserPlaceholder'),
    width: 190,
  },
  {
    key: 'used_by_text',
    type: 'input',
    label: t('paymentRedeemCode.filters.usedBy'),
    placeholder: t('paymentRedeemCode.filters.usedByPlaceholder'),
    width: 130,
  },
  {
    key: 'note',
    type: 'input',
    label: t('paymentRedeemCode.filters.note'),
    placeholder: t('paymentRedeemCode.filters.notePlaceholder'),
    width: 180,
  },
  {
    key: 'dateRange',
    type: 'date-range',
    label: t('paymentRedeemCode.filters.createdRange'),
    width: 260,
  },
])

const columns = computed<TableColumn<RedeemCodeItem>[]>(() => [
  { prop: 'code', label: t('paymentRedeemCode.columns.code'), minWidth: 250, elementProps: { align: 'left' } },
  { prop: 'batch_no', label: t('paymentRedeemCode.columns.batchNo'), minWidth: 180 },
  { prop: 'amount', label: t('paymentRedeemCode.columns.amount'), width: 110 },
  { prop: 'state', label: t('paymentRedeemCode.columns.state'), width: 110 },
  { prop: 'expires_at', label: t('paymentRedeemCode.columns.expiry'), minWidth: 180 },
  { key: 'redemption', label: t('paymentRedeemCode.columns.redemption'), minWidth: 230 },
  { key: 'creation', label: t('paymentRedeemCode.columns.creation'), minWidth: 210 },
  { prop: 'note', label: t('paymentRedeemCode.columns.note'), minWidth: 170 },
  { key: 'actions', label: t('common.actions.action'), width: 110, fixed: 'right' },
])
const displayPagination = computed(() => lookupActive.value ? null : page.value)
const tableProps = computed(() => ({ height: '100%' }))

function stateLabel(state: string) {
  const configured = stateOptions.value.find(({ value }) => value === state)?.label
  if (configured) return configured
  const fallback: Record<string, string> = {
    unused: t('paymentRedeemCode.states.unused'),
    used: t('paymentRedeemCode.states.used'),
    expired: t('paymentRedeemCode.states.expired'),
    voided: t('paymentRedeemCode.states.voided'),
  }
  return fallback[state] ?? state
}

function stateTagType(state: string) {
  if (state === 'unused') return 'success'
  if (state === 'expired') return 'warning'
  if (state === 'voided') return 'danger'
  return 'info'
}

function refreshPage() {
  return lookupActive.value ? lookup() : refresh()
}
</script>

<template>
  <div
    v-loading="pageLoading"
    class="redeem-code-page"
  >
    <div
      class="redeem-code-page__lookup"
      role="search"
      :aria-label="t('paymentRedeemCode.lookup.label')"
    >
      <span class="redeem-code-page__lookup-label">{{ t('paymentRedeemCode.lookup.label') }}</span>
      <el-input
        v-model="lookupInput"
        data-test="lookup-code"
        class="redeem-code-page__lookup-input"
        clearable
        autocomplete="off"
        :placeholder="t('paymentRedeemCode.lookup.placeholder')"
        @keyup.enter="lookup"
      >
        <template #prefix>
          <el-icon><SearchIcon /></el-icon>
        </template>
      </el-input>
      <el-button
        data-test="lookup-submit"
        type="primary"
        :icon="SearchIcon"
        :loading="lookupLoading"
        @click="lookup"
      >
        {{ t('paymentRedeemCode.actions.lookup') }}
      </el-button>
      <el-button
        v-if="lookupActive"
        @click="clearLookup"
      >
        {{ t('paymentRedeemCode.actions.backToList') }}
      </el-button>
    </div>

    <Search
      v-model="searchForm"
      :fields="searchFields"
      :collapse-count="3"
      @query="onSearch"
      @reset="onSearch"
    />

    <div class="redeem-code-page__table">
      <AppTable
        :columns="columns"
        :data="displayedData"
        :loading="loading || lookupLoading"
        :pagination="displayPagination"
        :selectable="canVoid && !lookupActive"
        :selection-selectable="canVoidRow"
        :table-props="tableProps"
        :refresh-loading="loading || lookupLoading"
        row-key="id"
        @refresh="refreshPage"
        @selection-change="onSelectionChange"
        @update:pagination="onPageChange"
      >
        <template #toolbar-left>
          <el-button
            v-if="canVoid && !lookupActive"
            data-test="void-selected"
            type="danger"
            plain
            :icon="Delete"
            :disabled="selectedIds.length === 0"
            :loading="voiding"
            @click="voidSelected"
          >
            {{ t('paymentRedeemCode.actions.voidSelected') }}
          </el-button>
        </template>
        <template #toolbar-right>
          <el-button
            v-if="canGenerate"
            data-test="open-generate-dialog"
            type="primary"
            :icon="Plus"
            @click="generateDialogVisible = true"
          >
            {{ t('paymentRedeemCode.actions.generate') }}
          </el-button>
          <el-button
            :icon="Download"
            :loading="exporting"
            @click="exportCodes"
          >
            {{ t('common.actions.export') }}
          </el-button>
        </template>

        <template #cell-code="{ row }">
          <div class="redeem-code-value">
            <code>{{ row.code }}</code>
            <el-tooltip :content="t('paymentRedeemCode.actions.copyCode')">
              <el-button
                text
                circle
                :icon="CopyDocument"
                :aria-label="t('paymentRedeemCode.actions.copyCode')"
                @click.stop="copy(row.code)"
              />
            </el-tooltip>
          </div>
        </template>
        <template #cell-state="{ row }">
          <el-tag
            :type="stateTagType(row.state)"
            effect="light"
          >
            {{ stateLabel(row.state) }}
          </el-tag>
        </template>
        <template #cell-expires_at="{ row }">
          <div class="redeem-fact">
            <span>{{ row.expires_at || t('paymentRedeemCode.facts.neverExpires') }}</span>
            <small v-if="row.state === 'expired'">{{ t('paymentRedeemCode.states.expired') }}</small>
          </div>
        </template>
        <template #cell-redemption="{ row }">
          <div
            v-if="row.state === 'used'"
            class="redeem-fact"
          >
            <span>{{ row.used_username || row.used_account || row.used_by }}</span>
            <small>{{ row.used_at }}</small>
            <el-button
              v-if="row.wallet_transaction_no"
              data-test="ledger-link"
              link
              type="primary"
              :icon="Link"
              @click.stop="goToLedger(row)"
            >
              {{ row.wallet_transaction_no }}
            </el-button>
          </div>
          <span v-else>-</span>
        </template>
        <template #cell-creation="{ row }">
          <div class="redeem-fact">
            <span>{{ row.creator_username || row.created_by }}</span>
            <small>{{ row.created_at }}</small>
          </div>
        </template>
        <template #cell-actions="{ row }">
          <el-button
            v-if="canVoid && canVoidRow(row)"
            data-test="void-row"
            link
            type="danger"
            :icon="Delete"
            :loading="voiding"
            @click.stop="voidRows([row])"
          >
            {{ t('paymentRedeemCode.actions.void') }}
          </el-button>
        </template>
      </AppTable>
    </div>

    <RedeemCodeGenerateDialog
      v-model="generateDialogVisible"
      :generating="generating"
      :has-pending-request="hasPendingGeneration"
      :generate="generateBatch"
      :export-batch="exportBatch"
      :abandon-pending="abandonPendingGeneration"
    />
  </div>
</template>

<style scoped>
.redeem-code-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.redeem-code-page__lookup {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.redeem-code-page__lookup-label {
  color: var(--el-text-color-regular);
  font-size: 14px;
  font-weight: 600;
}

.redeem-code-page__lookup-input {
  flex: 1 1 280px;
  width: min(440px, 100%);
  max-width: 440px;
}

.redeem-code-page__lookup-input :deep(input),
.redeem-code-value code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-variant-numeric: tabular-nums;
}

.redeem-code-page__table {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.redeem-code-page__table :deep(.table-toolbar),
.redeem-code-page__table :deep(.toolbar-left),
.redeem-code-page__table :deep(.toolbar-right),
.redeem-code-page__table :deep(.el-space) {
  flex-wrap: wrap;
  gap: 8px;
}

.redeem-code-value {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.redeem-code-value code {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--el-text-color-primary);
  font-size: 13px;
}

.redeem-fact {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  line-height: 1.45;
  text-align: left;
}

.redeem-fact span,
.redeem-fact small {
  max-width: 100%;
  overflow-wrap: anywhere;
}

.redeem-fact small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

@media (max-width: 720px) {
  .redeem-code-page__lookup-label {
    flex-basis: 100%;
  }

  .redeem-code-page__lookup-input {
    max-width: none;
  }

  .redeem-code-page__table :deep(.table-toolbar) {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
