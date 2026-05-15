<script setup lang="ts">
import RechargeCheckoutPanel from './components/RechargeCheckoutPanel.vue'
import RechargePackageGrid from './components/RechargePackageGrid.vue'
import RechargePaymentMethodCard from './components/RechargePaymentMethodCard.vue'
import RechargeRecentRecords from './components/RechargeRecentRecords.vue'
import RechargeRecordsTable from './components/RechargeRecordsTable.vue'
import { usePaymentRechargePage } from './composables/usePaymentRechargePage'

const {
  activeTab,
  pageLoading,
  submitting,
  wallet,
  packages,
  paymentMethod,
  recent,
  selectedPackageCode,
  selectedPackage,
  balanceAfterText,
  canSubmit,
  columns,
  searchFields,
  searchForm,
  data,
  loading,
  page,
  refresh,
  onPageChange,
  onSearch,
  selectPackage,
  createRecharge,
  payRecharge,
  syncRecharge,
  closeRecharge,
  canPay,
  canSync,
  canClose,
} = usePaymentRechargePage()
</script>

<template>
  <div v-loading="pageLoading" class="payment-recharge-page">
    <el-tabs v-model="activeTab" class="payment-recharge-page__tabs">
      <el-tab-pane label="充值" name="cashier">
        <div class="payment-recharge-page__cashier">
          <div class="payment-recharge-page__main">
            <RechargePackageGrid
              :packages="packages"
              :selected-code="selectedPackageCode"
              @select="selectPackage"
            />
            <RechargePaymentMethodCard :method="paymentMethod" />
          </div>
          <div class="payment-recharge-page__side">
            <RechargeCheckoutPanel
              :wallet="wallet"
              :selected-package="selectedPackage"
              :balance-after-text="balanceAfterText"
              :submitting="submitting"
              :can-submit="canSubmit"
              @submit="createRecharge"
            />
            <RechargeRecentRecords
              :records="recent"
              :can-pay="canPay"
              :can-sync="canSync"
              :can-close="canClose"
              @pay="payRecharge"
              @sync="syncRecharge"
              @close="closeRecharge"
            />
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="充值记录" name="records">
        <RechargeRecordsTable
          v-model:search-form="searchForm"
          :columns="columns"
          :data="data"
          :loading="loading"
          :page="page"
          :search-fields="searchFields"
          :can-pay="canPay"
          :can-sync="canSync"
          :can-close="canClose"
          @search="onSearch"
          @refresh="refresh"
          @page-change="onPageChange"
          @pay="payRecharge"
          @sync="syncRecharge"
          @close="closeRecharge"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.payment-recharge-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.payment-recharge-page__tabs {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.payment-recharge-page__tabs :deep(.el-tabs__content) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.payment-recharge-page__tabs :deep(.el-tab-pane) {
  height: 100%;
}

.payment-recharge-page__cashier {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
  gap: 16px;
  min-height: 100%;
}

.payment-recharge-page__main,
.payment-recharge-page__side {
  min-width: 0;
}

@media (max-width: 980px) {
  .payment-recharge-page__cashier {
    grid-template-columns: 1fr;
  }
}
</style>
