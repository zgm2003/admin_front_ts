<script setup lang="ts">
import { computed } from 'vue'
import { AppDialog } from '@/components/AppDialog'
import { Search } from '@/components/Search'
import { AppTable } from '@/components/Table'
import { CommonEnum } from '@/enums'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import PaymentConfigForm from './components/PaymentConfigForm.vue'
import { usePaymentConfigPage, type PaymentConfigFormRef } from './composables/usePaymentConfigPage'

const userStore = useUserStore()
const isMobile = useIsMobile()
const dialogLayout = computed(() => ({
  width: isMobile.value ? '94vw' : '920px',
  height: isMobile.value ? '72vh' : '70vh',
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
  dialogVisible,
  dialogMode,
  formRef,
  form,
  rules,
  uploadLoading,
  changeStatus,
  openAddDialog,
  openEditDialog,
  confirmSubmit,
  confirmDel,
  uploadCert,
  testConfig,
} = usePaymentConfigPage()

function setFormRef(instance: unknown) {
  formRef.value = isPaymentConfigFormRef(instance) ? instance : null
}

function isPaymentConfigFormRef(instance: unknown): instance is PaymentConfigFormRef {
  return typeof instance === 'object'
    && instance !== null
    && 'validate' in instance
    && 'clearValidate' in instance
}
</script>

<template>
  <div class="payment-config-page">
    <Search
      v-model="searchForm"
      :fields="searchFields"
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
          v-if="userStore.can('payment_config_add')"
          type="success"
          @click="openAddDialog"
        >
          新增
        </el-button>
      </template>
      <template #cell-environment_text="{ row }">
        <el-tag :type="row.environment === 'sandbox' ? 'warning' : 'success'">
          {{ row.environment_text }}
        </el-tag>
      </template>
      <template #cell-status_text="{ row }">
        <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">
          {{ row.status_text }}
        </el-tag>
      </template>
      <template #cell-actions="{ row }">
        <el-button
          v-if="userStore.can('payment_config_edit')"
          type="primary"
          text
          @click="openEditDialog(row)"
        >
          编辑
        </el-button>
        <el-button
          v-if="userStore.can('payment_config_status')"
          type="warning"
          text
          @click="changeStatus(row)"
        >
          {{ row.status === CommonEnum.YES ? '禁用' : '启用' }}
        </el-button>
        <el-button
          v-if="userStore.can('payment_config_test')"
          type="success"
          text
          @click="testConfig(row)"
        >
          测试配置
        </el-button>
        <el-button
          v-if="userStore.can('payment_config_del')"
          type="danger"
          text
          @click="confirmDel(row)"
        >
          删除
        </el-button>
      </template>
    </AppTable>
  </div>

  <AppDialog
    v-model="dialogVisible"
    :height="dialogLayout.height"
    :top="dialogLayout.top"
    :width="dialogLayout.width"
    draggable
  >
    <template #header>
      {{ dialogMode === 'edit' ? '编辑支付配置' : '新增支付配置' }}
    </template>
    <PaymentConfigForm
      :ref="setFormRef"
      v-model="form"
      :can-upload="userStore.can('payment_config_upload_cert')"
      :dialog-mode="dialogMode"
      :dict="dict"
      :rules="rules"
      :upload-cert="uploadCert"
      :upload-loading="uploadLoading"
    />
    <template #footer>
      <el-button @click="dialogVisible = false">
        取消
      </el-button>
      <el-button
        type="primary"
        @click="confirmSubmit"
      >
        确认
      </el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.payment-config-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
