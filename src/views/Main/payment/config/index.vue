<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
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
const { t } = useI18n()
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
  editingPrivateKeyHint,
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
          {{ t('common.actions.add') }}
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
        <div class="payment-config-page__actions">
          <el-button
            v-if="userStore.can('payment_config_edit')"
            type="primary"
            text
            @click="openEditDialog(row)"
          >
            {{ t('common.actions.edit') }}
          </el-button>
          <el-button
            v-if="userStore.can('payment_config_status')"
            type="warning"
            text
            @click="changeStatus(row)"
          >
            {{ row.status === CommonEnum.YES ? t('common.actions.disable') : t('common.actions.enable') }}
          </el-button>
          <el-button
            v-if="userStore.can('payment_config_test')"
            type="success"
            text
            @click="testConfig(row)"
          >
            {{ t('paymentConfig.actions.testConfig') }}
          </el-button>
          <el-button
            v-if="userStore.can('payment_config_del')"
            type="danger"
            text
            @click="confirmDel(row)"
          >
            {{ t('common.actions.del') }}
          </el-button>
        </div>
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
      {{ dialogMode === 'edit' ? t('paymentConfig.dialog.editTitle') : t('paymentConfig.dialog.addTitle') }}
    </template>
    <PaymentConfigForm
      :ref="setFormRef"
      v-model="form"
      :can-upload="userStore.can('payment_config_upload_cert')"
      :dialog-mode="dialogMode"
      :dict="dict"
      :private-key-hint="editingPrivateKeyHint"
      :rules="rules"
      :upload-cert="uploadCert"
      :upload-loading="uploadLoading"
    />
    <template #footer>
      <el-button @click="dialogVisible = false">
        {{ t('common.actions.cancel') }}
      </el-button>
      <el-button
        type="primary"
        @click="confirmSubmit"
      >
        {{ t('common.actions.confirm') }}
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

.payment-config-page__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  white-space: nowrap;
}

.payment-config-page__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
