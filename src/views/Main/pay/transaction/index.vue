<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import { formatFen } from '@/enums/PayEnum'
import { usePayTransactionPage } from './composables/usePayTransactionPage'

const { t } = useI18n()
const isMobile = useIsMobile()

const {
  channelRespJSON,
  columns,
  detailData,
  detailVisible,
  formatPayTransactionUserDisplay,
  getTransactionStatusTagType,
  hasChannelResp,
  hasRawNotify,
  listData,
  listLoading,
  onPageChange,
  onSearch,
  page,
  rawNotifyJSON,
  refresh,
  searchFields,
  searchForm,
  showDetail,
} = usePayTransactionPage({ isMobile, t })
</script>

<template>
  <div class="box">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="onSearch"
      @reset="onSearch"
    />
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
        <template #cell-user_name="{ row }">
          <span>{{ formatPayTransactionUserDisplay(row) }}</span>
        </template>
        <template #cell-status_text="{ row }">
          <el-tag :type="getTransactionStatusTagType(row.status)">
            {{ row.status_text }}
          </el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button
            type="primary"
            text
            @click="showDetail(row)"
          >
            {{ t('common.actions.detail') }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <AppDialog
    v-model="detailVisible"
    :width="isMobile ? '94vw' : '800px'"
  >
    <template #header>
      {{ t('pay_transaction.detail.title') }}
    </template>
    <el-descriptions
      v-if="detailData"
      :column="2"
      border
    >
      <el-descriptions-item :label="t('pay_transaction.table.transaction_no')">
        {{ detailData.transaction.transaction_no }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.attempt_no')">
        {{ detailData.transaction.attempt_no }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.order_no')">
        {{ detailData.transaction.order_no }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.user_name')">
        {{ detailData.order ? formatPayTransactionUserDisplay(detailData.order) : '--' }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.channel')">
        {{ detailData.channel?.name ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.pay_method')">
        {{ detailData.transaction.pay_method ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.amount')">
        ¥{{ formatFen(detailData.transaction.amount) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.trade_no')">
        {{ detailData.transaction.trade_no ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.trade_status')">
        {{ detailData.transaction.trade_status ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.status')">
        <el-tag :type="getTransactionStatusTagType(detailData.transaction.status)">
          {{ detailData.transaction.status_text }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.paid_at')">
        {{ detailData.transaction.paid_at ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.closed_at')">
        {{ detailData.transaction.closed_at ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.created_at')">
        {{ detailData.transaction.created_at }}
      </el-descriptions-item>

      <el-descriptions-item
        :label="t('pay_transaction.table.order')"
        :span="2"
      >
        <template v-if="detailData.order">
          {{ detailData.order.order_no }} | ¥{{ formatFen(detailData.order.pay_amount) }} |
          <el-tag size="small">
            {{ detailData.order.pay_status === 3 ? '已支付' : '未支付' }}
          </el-tag>
        </template>
        <template v-else>
          -
        </template>
      </el-descriptions-item>

      <el-descriptions-item
        v-if="hasChannelResp"
        :label="t('pay_transaction.detail.channel_resp')"
        :span="2"
      >
        <el-input
          type="textarea"
          :rows="4"
          :model-value="channelRespJSON"
          readonly
        />
      </el-descriptions-item>
      <el-descriptions-item
        v-if="hasRawNotify"
        :label="t('pay_transaction.detail.raw_notify')"
        :span="2"
      >
        <el-input
          type="textarea"
          :rows="4"
          :model-value="rawNotifyJSON"
          readonly
        />
      </el-descriptions-item>
    </el-descriptions>
  </AppDialog>
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
