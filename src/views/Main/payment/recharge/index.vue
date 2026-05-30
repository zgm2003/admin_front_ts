<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import RechargeCheckoutPanel from './components/RechargeCheckoutPanel.vue'
import RechargePackageGrid from './components/RechargePackageGrid.vue'
import RechargeRecentRecords from './components/RechargeRecentRecords.vue'
import RechargeRecordsTable from './components/RechargeRecordsTable.vue'
import { usePaymentRechargePage } from './composables/usePaymentRechargePage'

const { t } = useI18n()
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
  <div
    v-loading="pageLoading"
    class="payment-recharge-page"
  >
    <el-tabs
      v-model="activeTab"
      class="payment-recharge-page__tabs"
    >
      <el-tab-pane
        :label="t('paymentRecharge.tabs.cashier')"
        name="cashier"
      >
        <div class="payment-recharge-page__cashier">
          <div class="payment-recharge-page__workbench">
            <div class="payment-recharge-page__main">
              <RechargePackageGrid
                :packages="packages"
                :selected-code="selectedPackageCode"
                @select="selectPackage"
              />
            </div>
            <div class="payment-recharge-page__side">
              <RechargeCheckoutPanel
                :wallet="wallet"
                :payment-method="paymentMethod"
                :selected-package="selectedPackage"
                :balance-after-text="balanceAfterText"
                :submitting="submitting"
                :can-submit="canSubmit"
                @submit="createRecharge"
              />
            </div>
            <div class="payment-recharge-page__recent">
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
        </div>
      </el-tab-pane>
      <el-tab-pane
        :label="t('paymentRecharge.tabs.records')"
        name="records"
      >
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

<style>
@media (min-width: 981px) {
  .el-main.layout-content .layout-view.page-card:has(.payment-recharge-page) {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
}
</style>

<style scoped>
.payment-recharge-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.payment-recharge-page__tabs {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.payment-recharge-page__tabs :deep(.el-tabs__header) {
  flex-shrink: 0;
}

.payment-recharge-page__tabs :deep(.el-tabs__content) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.payment-recharge-page__tabs :deep(.el-tab-pane) {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.payment-recharge-page__cashier {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
  min-width: 0;
  padding-right: 6px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.payment-recharge-page__workbench {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: minmax(0, 1fr) clamp(320px, 25vw, 390px);
  grid-template-areas:
    "main side"
    "recent side";
  gap: 16px;
  align-items: start;
  min-width: 0;
}

.payment-recharge-page__main,
.payment-recharge-page__side {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.payment-recharge-page__main {
  grid-area: main;
}

.payment-recharge-page__side {
  grid-area: side;
  position: sticky;
  top: 0;
}

.payment-recharge-page__recent {
  flex: 0 0 auto;
  grid-area: recent;
  min-width: 0;
}

@media (max-width: 980px) {
  .payment-recharge-page,
  .payment-recharge-page__tabs,
  .payment-recharge-page__tabs :deep(.el-tabs__content),
  .payment-recharge-page__tabs :deep(.el-tab-pane),
  .payment-recharge-page__cashier {
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .payment-recharge-page__cashier {
    padding-right: 0;
  }

  .payment-recharge-page__workbench {
    grid-template-columns: 1fr;
    grid-template-areas:
      "main"
      "side"
      "recent";
  }

  .payment-recharge-page__side {
    position: static;
  }
}
</style>
