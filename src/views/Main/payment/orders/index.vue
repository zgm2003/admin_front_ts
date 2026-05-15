<script setup lang="ts">
import { computed } from 'vue'
import { AppDialog } from '@/components/AppDialog'
import { Search } from '@/components/Search'
import { AppTable } from '@/components/Table'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import PaymentOrderDetailDialog from './components/PaymentOrderDetailDialog.vue'
import { usePaymentOrderPage } from './composables/usePaymentOrderPage'

const userStore = useUserStore()
const isMobile = useIsMobile()
const detailDialogLayout = computed(() => ({
  width: isMobile.value ? '94vw' : '960px',
  height: isMobile.value ? '76vh' : '72vh',
  top: isMobile.value ? '3vh' : '4vh',
}))

const {
  columns,
  data,
  loading,
  page,
  refresh,
  onPageChange,
  searchForm,
  searchFields,
  onSearch,
  detailDialogVisible,
  detail,
  detailLoading,
  openDetailDialog,
  payOrder,
  syncOrder,
  closeOrder,
  canPay,
  canClose,
} = usePaymentOrderPage()

</script>

<template>
  <div class="payment-order-page">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      :collapse-count="2"
      @query="onSearch"
      @reset="onSearch"
    />
    <AppTable
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="page"
      row-key="id"
      @refresh="refresh"
      @update:pagination="onPageChange"
    >
      <template #toolbar-left>
        <el-text type="info">底层支付订单只保留查询、继续支付、同步和关闭能力。</el-text>
      </template>
      <template #cell-status_text="{ row }">
        <el-tag :type="row.status === 'paid' ? 'success' : row.status === 'failed' ? 'danger' : row.status === 'closed' ? 'info' : 'warning'">
          {{ row.status_text }}
        </el-tag>
      </template>
      <template #cell-actions="{ row }">
        <el-button
          type="primary"
          text
          @click="openDetailDialog(row)"
        >
          详情
        </el-button>
        <el-button
          v-if="userStore.can('payment_order_pay') && canPay(row)"
          type="success"
          text
          @click="payOrder(row)"
        >
          发起支付
        </el-button>
        <el-button
          v-if="userStore.can('payment_order_sync')"
          type="warning"
          text
          @click="syncOrder(row)"
        >
          同步
        </el-button>
        <el-button
          v-if="userStore.can('payment_order_close') && canClose(row)"
          type="danger"
          text
          @click="closeOrder(row)"
        >
          关闭
        </el-button>
      </template>
    </AppTable>
  </div>

  <AppDialog
    v-model="detailDialogVisible"
    :height="detailDialogLayout.height"
    :top="detailDialogLayout.top"
    :width="detailDialogLayout.width"
    draggable
  >
    <template #header>
      支付订单详情
    </template>
    <PaymentOrderDetailDialog
      :detail="detail"
      :loading="detailLoading"
    />
    <template #footer>
      <el-button @click="detailDialogVisible = false">
        关闭
      </el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.payment-order-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
