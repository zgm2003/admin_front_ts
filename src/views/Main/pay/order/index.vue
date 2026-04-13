<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import { formatFen } from '@/enums/PayEnum'
import { usePayOrderPage } from './composables/usePayOrderPage'

const userStore = useUserStore()
const { t } = useI18n()
const isMobile = useIsMobile()
const {
  activeStatusTab,
  closeForm,
  closeFormRef,
  closeRules,
  closeVisible,
  columns,
  confirmClose,
  confirmRemark,
  detailData,
  detailVisible,
  formatOrderUserDisplay,
  getBizStatusTagType,
  getPayStatusTagType,
  isCloseDisabled,
  listData,
  listLoading,
  onPageChange,
  onSearch,
  onTabChange,
  openClose,
  openRemark,
  page,
  refresh,
  remarkForm,
  remarkFormRef,
  remarkVisible,
  searchFields,
  searchForm,
  showDetail,
  statusTabs,
} = usePayOrderPage({ isMobile, t })

void closeFormRef.value
void remarkFormRef.value
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
        <template #cell-user_name="{ row }">
          <span>{{ formatOrderUserDisplay(row) }}</span>
        </template>
        <template #cell-pay_status_text="{ row }">
          <el-tag :type="getPayStatusTagType(row.pay_status)">{{ row.pay_status_text }}</el-tag>
        </template>
        <template #cell-biz_status_text="{ row }">
          <el-tag :type="getBizStatusTagType(row.biz_status)">{{ row.biz_status_text }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="showDetail(row)">{{ t('common.actions.detail') }}</el-button>
          <el-button
            type="danger"
            text
            v-if="userStore.can('pay_order_edit')"
            @click="openClose(row)"
            :disabled="isCloseDisabled(row)"
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
        <el-descriptions-item :label="t('pay_order.table.user_name')">{{ formatOrderUserDisplay(detailData.order) }}</el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.order_type')">{{ detailData.order.order_type_text }}</el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.user_id')">{{ detailData.order.user_id }}</el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.pay_amount')">¥{{ formatFen(detailData.order.pay_amount) }}</el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.pay_status')">
          <el-tag :type="getPayStatusTagType(detailData.order.pay_status)">{{ detailData.order.pay_status_text }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('pay_order.table.biz_status')">
          <el-tag :type="getBizStatusTagType(detailData.order.biz_status)">{{ detailData.order.biz_status_text }}</el-tag>
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
