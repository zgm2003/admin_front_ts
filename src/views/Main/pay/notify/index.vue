<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import { usePayNotifyLogPage } from './composables/usePayNotifyLogPage'

const { t } = useI18n()
const isMobile = useIsMobile()

const {
  columns,
  detailData,
  detailVisible,
  headersJSON,
  listData,
  listLoading,
  onPageChange,
  onSearch,
  page,
  rawDataJSON,
  refresh,
  searchFields,
  searchForm,
  showDetail,
} = usePayNotifyLogPage({ isMobile, t })
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
    :width="isMobile ? '94vw' : '860px'"
    :title="t('pay_notify.detail.title')"
  >
    <el-descriptions
      v-if="detailData"
      :column="2"
      border
    >
      <el-descriptions-item :label="t('pay_notify.table.channel')">
        {{ detailData.log.channel_text }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.table.notify_type')">
        {{ detailData.log.notify_type_text }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.table.transaction_no')">
        {{ detailData.log.transaction_no || '-' }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.table.trade_no')">
        {{ detailData.log.trade_no || '-' }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.table.process_status')">
        {{ detailData.log.process_status_text }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.table.ip')">
        {{ detailData.log.ip || '-' }}
      </el-descriptions-item>
      <el-descriptions-item
        :label="t('pay_notify.table.process_msg')"
        :span="2"
      >
        {{ detailData.log.process_msg || '-' }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.table.created_at')">
        {{ detailData.log.created_at }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.table.updated_at')">
        {{ detailData.log.updated_at }}
      </el-descriptions-item>
      <el-descriptions-item
        :label="t('pay_notify.detail.headers')"
        :span="2"
      >
        <el-input
          type="textarea"
          :rows="5"
          :model-value="headersJSON"
          readonly
        />
      </el-descriptions-item>
      <el-descriptions-item
        :label="t('pay_notify.detail.raw_data')"
        :span="2"
      >
        <el-input
          type="textarea"
          :rows="8"
          :model-value="rawDataJSON"
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
