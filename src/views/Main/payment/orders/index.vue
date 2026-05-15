<script setup lang="ts">
import { computed } from 'vue'
import { AppDialog } from '@/components/AppDialog'
import { Search } from '@/components/Search'
import { AppTable } from '@/components/Table'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import PaymentOrderFormDialog from './components/PaymentOrderFormDialog.vue'
import PaymentOrderDetailDialog from './components/PaymentOrderDetailDialog.vue'
import { usePaymentOrderPage, type PaymentOrderFormRef } from './composables/usePaymentOrderPage'

const userStore = useUserStore()
const isMobile = useIsMobile()
const dialogLayout = computed(() => ({
  width: isMobile.value ? '94vw' : '860px',
  height: isMobile.value ? '72vh' : '68vh',
  top: isMobile.value ? '3vh' : '4vh',
}))
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
  dict,
  configOptions,
  formDialogVisible,
  detailDialogVisible,
  formRef,
  form,
  rules,
  detail,
  detailLoading,
  openCreateDialog,
  confirmCreate,
  openDetailDialog,
  payOrder,
  syncOrder,
  closeOrder,
  canPay,
  canClose,
} = usePaymentOrderPage()

function setFormRef(instance: unknown) {
  formRef.value = isPaymentOrderFormRef(instance) ? instance : null
}

function isPaymentOrderFormRef(instance: unknown): instance is PaymentOrderFormRef {
  return typeof instance === 'object'
    && instance !== null
    && 'validate' in instance
    && 'clearValidate' in instance
}
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
        <el-button
          v-if="userStore.can('payment_order_add')"
          type="success"
          @click="openCreateDialog"
        >
          新增订单
        </el-button>
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
    v-model="formDialogVisible"
    :height="dialogLayout.height"
    :top="dialogLayout.top"
    :width="dialogLayout.width"
    draggable
  >
    <template #header>
      新增支付订单
    </template>
    <PaymentOrderFormDialog
      :ref="setFormRef"
      v-model="form"
      :config-options="configOptions"
      :dict="dict"
      :rules="rules"
    />
    <template #footer>
      <el-button @click="formDialogVisible = false">
        取消
      </el-button>
      <el-button type="primary" @click="confirmCreate">
        确认
      </el-button>
    </template>
  </AppDialog>

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
