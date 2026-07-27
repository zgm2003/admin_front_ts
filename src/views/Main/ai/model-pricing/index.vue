<script setup lang="ts">
import { computed } from 'vue'
import { Edit, RefreshLeft } from '@element-plus/icons-vue'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { AiModelPriceItem, AiModelPriceRate } from '@/api/ai/model-prices'
import ModelPriceDrawer from './components/ModelPriceDrawer.vue'
import { useModelPricingPage } from './use-model-pricing-page'

const {
  t,
  loading,
  drawerLoading,
  saving,
  restoringModelID,
  drawerVisible,
  listData,
  selectedPrice,
  searchForm,
  searchFields,
  canEdit,
  getList,
  onSearch,
  openEdit,
  saveOverride,
  restoreOfficial,
} = useModelPricingPage()

const columns = computed(() => [
  { key: 'model', label: t('aiModelPricing.columns.model'), minWidth: 220, fixed: 'left' },
  { key: 'official', label: t('aiModelPricing.columns.official'), minWidth: 300 },
  { key: 'effective', label: t('aiModelPricing.columns.effective'), minWidth: 300 },
  { key: 'source', label: t('aiModelPricing.columns.source'), width: 120 },
  { key: 'verified', label: t('aiModelPricing.columns.verifiedAt'), width: 130 },
  { key: 'actions', label: t('common.actions.action'), width: 180, fixed: 'right' },
])

function familyLabel(family: string): string {
  return family === 'gpt' ? 'GPT' : family === 'claude' ? 'Claude' : family
}

function categoryLabel(rate: AiModelPriceRate): string {
  return t(`aiModelPricing.categories.${rate.category}`)
}

function tierLabel(rate: AiModelPriceRate): string {
  return rate.tier_key || t('aiModelPricing.tiers.default')
}

function unitLabel(rate: AiModelPriceRate): string {
  if (rate.unit === 'token' && rate.unit_scale === 1_000_000) {
    return t('aiModelPricing.units.millionTokensShort')
  }
  return t('aiModelPricing.units.scaledShort', { scale: rate.unit_scale, unit: rate.unit })
}

function isOverride(row: AiModelPriceItem): boolean {
  return row.effective.source === 'override' && row.effective.override_version > 0
}
</script>

<template>
  <div class="model-pricing-page">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="onSearch"
      @reset="onSearch"
    />

    <div class="model-pricing-page__table">
      <AppTable
        :columns="columns"
        :data="listData"
        :loading="loading"
        :table-props="{ height: '100%' }"
        row-key="model_id"
        @refresh="getList"
      >
        <template #cell-model="{ row }">
          <div class="model-pricing-page__model">
            <div>
              <el-tag
                size="small"
                effect="plain"
              >
                {{ familyLabel(row.model_family) }}
              </el-tag>
              <code>{{ row.model_id }}</code>
            </div>
            <small v-if="row.aliases.length">
              {{ t('aiModelPricing.labels.aliases') }}: {{ row.aliases.join(', ') }}
            </small>
            <small>{{ row.catalog_vendor }} · {{ row.catalog_version }}</small>
          </div>
        </template>

        <template #cell-official="{ row }">
          <div
            v-if="row.official.available"
            class="model-pricing-page__rates"
          >
            <div
              v-for="rate in row.official.rates"
              :key="`${rate.category}:${rate.unit}:${rate.tier_key}`"
              class="model-pricing-page__rate"
            >
              <span>{{ categoryLabel(rate) }} · {{ tierLabel(rate) }}</span>
              <strong>¥{{ rate.price }}</strong>
              <small>/ {{ unitLabel(rate) }}</small>
            </div>
          </div>
          <span
            v-else
            class="model-pricing-page__muted"
          >
            {{ t('aiModelPricing.labels.unavailable') }}
          </span>
        </template>

        <template #cell-effective="{ row }">
          <div
            v-if="row.effective.available"
            class="model-pricing-page__rates"
          >
            <div
              v-for="rate in row.effective.rates"
              :key="`${rate.category}:${rate.unit}:${rate.tier_key}`"
              data-test="effective-rate"
              class="model-pricing-page__rate"
            >
              <span>{{ categoryLabel(rate) }} · {{ tierLabel(rate) }}</span>
              <strong>¥{{ rate.price }}</strong>
              <small>/ {{ unitLabel(rate) }}</small>
            </div>
          </div>
          <span
            v-else
            class="model-pricing-page__muted"
          >
            {{ t('aiModelPricing.labels.unavailable') }}
          </span>
        </template>

        <template #cell-source="{ row }">
          <el-tag
            :type="isOverride(row) ? 'warning' : 'success'"
            effect="light"
          >
            {{ t(`aiModelPricing.sources.${row.effective.source}`) }}
          </el-tag>
        </template>

        <template #cell-verified="{ row }">
          <span class="model-pricing-page__verified">{{ row.effective.verified_at || '-' }}</span>
        </template>

        <template #cell-actions="{ row }">
          <div
            v-if="canEdit"
            class="model-pricing-page__actions"
          >
            <el-button
              data-test="edit-price"
              link
              type="primary"
              :icon="Edit"
              @click="openEdit(row)"
            >
              {{ t('common.actions.edit') }}
            </el-button>
            <el-button
              v-if="isOverride(row)"
              data-test="restore-price"
              link
              type="warning"
              :icon="RefreshLeft"
              :loading="restoringModelID === row.model_id"
              @click="restoreOfficial(row)"
            >
              {{ t('aiModelPricing.actions.restore') }}
            </el-button>
          </div>
          <span
            v-else
            class="model-pricing-page__muted"
          >
            {{ t('aiModelPricing.labels.readonly') }}
          </span>
        </template>
      </AppTable>
    </div>

    <ModelPriceDrawer
      v-model="drawerVisible"
      :item="selectedPrice"
      :loading="drawerLoading"
      :saving="saving"
      :can-edit="canEdit"
      @save="saveOverride"
    />
  </div>
</template>

<style scoped>
.model-pricing-page {
  display: flex;
  min-width: 0;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
}

.model-pricing-page__table {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.model-pricing-page__model,
.model-pricing-page__rates {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.model-pricing-page__model {
  gap: 5px;
}

.model-pricing-page__model > div {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.model-pricing-page__model code {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--el-text-color-primary);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 13px;
  font-weight: 650;
}

.model-pricing-page__model small,
.model-pricing-page__rate small,
.model-pricing-page__muted {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.model-pricing-page__rates {
  gap: 2px;
  padding: 3px 0;
}

.model-pricing-page__rate {
  display: grid;
  grid-template-columns: minmax(118px, 1fr) minmax(56px, auto) minmax(72px, auto);
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  padding: 3px 0;
  border-bottom: 1px dashed var(--el-border-color-extra-light);
  font-variant-numeric: tabular-nums;
}

.model-pricing-page__rate:last-child {
  border-bottom: 0;
}

.model-pricing-page__rate span {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.model-pricing-page__rate strong {
  color: var(--el-text-color-primary);
  text-align: right;
}

.model-pricing-page__rate small {
  white-space: nowrap;
}

.model-pricing-page__verified {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.model-pricing-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.model-pricing-page__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

@media (max-width: 768px) {
  .model-pricing-page__rate {
    grid-template-columns: minmax(106px, 1fr) auto;
  }

  .model-pricing-page__rate small {
    grid-column: 1 / -1;
  }
}
</style>
