<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import {
  PayNotifyLogApi,
  type PayNotifyLogDetailResponse,
  type PayNotifyLogItem,
} from '@/api/pay/notify'
import { useCrudTable } from '@/hooks/useCrudTable'

const { t } = useI18n()
const isMobile = useIsMobile()

const channelArr = ref<{ label: string; value: number }[]>([])
const notifyTypeArr = ref<{ label: string; value: number }[]>([])
const processStatusArr = ref<{ label: string; value: number }[]>([])

const init = async () => {
  const data = await PayNotifyLogApi.init()
  channelArr.value = data.dict.channel_arr
  notifyTypeArr.value = data.dict.notify_type_arr
  processStatusArr.value = data.dict.notify_process_status_arr
}

const searchForm = ref({
  transaction_no: '',
  channel: '' as number | '',
  notify_type: '' as number | '',
  process_status: '' as number | '',
})

const searchFields = computed<SearchField[]>(() => [
  { key: 'transaction_no', type: 'input', label: t('pay_notify.table.transaction_no'), placeholder: t('pay_notify.table.transaction_no'), width: 200 },
  { key: 'channel', type: 'select-v2', label: t('pay_notify.table.channel'), options: channelArr.value, width: 140 },
  { key: 'notify_type', type: 'select-v2', label: t('pay_notify.table.notify_type'), options: notifyTypeArr.value, width: 140 },
  { key: 'process_status', type: 'select-v2', label: t('pay_notify.table.process_status'), options: processStatusArr.value, width: 160 },
])

const { loading, data, page, getList, onPageChange, refresh, onSearch } = useCrudTable({
  api: PayNotifyLogApi,
  searchForm,
})

const columns = computed(() => [
  { key: 'transaction_no', label: t('pay_notify.table.transaction_no'), width: 220 },
  { key: 'trade_no', label: t('pay_notify.table.trade_no'), width: 220 },
  { key: 'channel_text', label: t('pay_notify.table.channel'), width: 120 },
  { key: 'notify_type_text', label: t('pay_notify.table.notify_type'), width: 120 },
  { key: 'process_status_text', label: t('pay_notify.table.process_status'), width: 140 },
  { key: 'process_msg', label: t('pay_notify.table.process_msg'), minWidth: 240 },
  { key: 'ip', label: t('pay_notify.table.ip'), width: 160 },
  { key: 'created_at', label: t('pay_notify.table.created_at'), width: 180 },
  { key: 'actions', label: t('common.actions.action'), width: 100 },
])

const detailVisible = ref(false)
const detailData = ref<PayNotifyLogDetailResponse | null>(null)

const showDetail = async (row: PayNotifyLogItem) => {
  detailData.value = await PayNotifyLogApi.detail({ id: row.id })
  detailVisible.value = true
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
        :data="data"
        :loading="loading"
        row-key="id"
        :pagination="page"
        :show-index="true"
        @refresh="refresh"
        @update:pagination="onPageChange"
      >
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="showDetail(row)">{{ t('common.actions.detail') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <AppDialog v-model="detailVisible" :width="isMobile ? '94vw' : '860px'" :title="t('pay_notify.detail.title')">
    <el-descriptions v-if="detailData" :column="2" border>
      <el-descriptions-item :label="t('pay_notify.table.channel')">{{ detailData.log.channel_text }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.table.notify_type')">{{ detailData.log.notify_type_text }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.table.transaction_no')">{{ detailData.log.transaction_no || '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.table.trade_no')">{{ detailData.log.trade_no || '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.table.process_status')">{{ detailData.log.process_status_text }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.table.ip')">{{ detailData.log.ip || '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.table.process_msg')" :span="2">{{ detailData.log.process_msg || '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.table.created_at')">{{ detailData.log.created_at }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.table.updated_at')">{{ detailData.log.updated_at }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.detail.headers')" :span="2">
        <el-input type="textarea" :rows="5" :model-value="JSON.stringify(detailData.log.headers ?? {}, null, 2)" readonly />
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_notify.detail.raw_data')" :span="2">
        <el-input type="textarea" :rows="8" :model-value="JSON.stringify(detailData.log.raw_data ?? {}, null, 2)" readonly />
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
