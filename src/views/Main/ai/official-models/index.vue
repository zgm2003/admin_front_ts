<script setup lang="ts">
import { computed } from 'vue'
import { Refresh, RefreshLeft, View } from '@element-plus/icons-vue'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { AiOfficialModelItem, AiOfficialModelRate } from '@/api/ai/official-models'
import OfficialModelDrawer from './components/OfficialModelDrawer.vue'
import { useOfficialModelPage } from './use-official-model-page'

const {
  t, loading, drawerLoading, saving, restoringModelID, drawerVisible,
  listData, selectedModel, searchForm, searchFields, canSyncPrice,
  getList, onSearch, openDetail, syncPrice, restoreOfficialPrice,
} = useOfficialModelPage()

const columns = computed(() => [
  { key: 'identity', label: t('aiOfficialModel.columns.identity'), minWidth: 230, fixed: 'left' },
  { key: 'lifecycle', label: t('aiOfficialModel.columns.lifecycle'), width: 80 },
  { key: 'modalities', label: t('aiOfficialModel.columns.modalities'), minWidth: 200 },
  { key: 'capabilities', label: t('aiOfficialModel.columns.capabilities'), minWidth: 160 },
  { key: 'limits', label: t('aiOfficialModel.columns.limits'), minWidth: 180 },
  { key: 'price', label: t('aiOfficialModel.columns.price'), minWidth: 300 },
  { key: 'verification', label: t('aiOfficialModel.columns.verification'), minWidth: 150 },
  { key: 'actions', label: t('common.actions.action'), width: 235, fixed: 'right' },
])

function categoryLabel(rate: AiOfficialModelRate): string {
  return t(`aiOfficialModel.categories.${rate.category}`)
}

function tierLabel(rate: AiOfficialModelRate): string {
  return rate.tier_key || t('aiOfficialModel.tiers.default')
}

function unitLabel(rate: AiOfficialModelRate): string {
  return rate.unit === 'token' && rate.unit_scale === 1_000_000
    ? t('aiOfficialModel.units.millionTokensShort')
    : t('aiOfficialModel.units.scaledShort', { scale: rate.unit_scale, unit: rate.unit })
}

function lifecycleType(value: AiOfficialModelItem['lifecycle_status']) {
  return value === 'active' ? 'success' : value === 'deprecated' ? 'warning' : 'danger'
}

function capabilityLabels(row: AiOfficialModelItem): string[] {
  const labels: string[] = []
  if (row.capabilities.supports_tools) labels.push(t('aiOfficialModel.capabilities.tools'))
  if (row.capabilities.supports_streaming) labels.push(t('aiOfficialModel.capabilities.streaming'))
  if (row.capabilities.supports_structured_output) labels.push(t('aiOfficialModel.capabilities.structuredOutput'))
  if (row.capabilities.native_file_input) labels.push(t('aiOfficialModel.capabilities.nativeFile'))
  return labels
}

function isOverride(row: AiOfficialModelItem): boolean {
  return row.effective.source === 'override' && row.effective.override_version > 0
}
</script>

<template>
  <div class="official-model-page">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
    <div class="official-model-page__table">
      <AppTable :columns="columns" :data="listData" :loading="loading" row-key="model_id" @refresh="getList">
        <template #cell-identity="{ row }">
          <div class="official-model-page__identity">
            <code>{{ row.model_id }}</code>
            <span>{{ row.catalog_vendor }} · {{ row.model_family }}</span>
            <small>{{ row.catalog_version }}</small>
          </div>
        </template>
        <template #cell-lifecycle="{ row }">
          <el-tag :data-test="`lifecycle-${row.lifecycle_status}`" :type="lifecycleType(row.lifecycle_status)" effect="light">
            {{ t(`aiOfficialModel.lifecycle.${row.lifecycle_status}`) }}
          </el-tag>
        </template>
        <template #cell-modalities="{ row }">
          <span data-test="model-modalities">
            <el-tag v-for="value in row.capabilities.input_modalities" :key="`in-${value}`" size="small" effect="plain">{{ value }}</el-tag>
            <span aria-hidden="true">→</span>
            <el-tag v-for="value in row.capabilities.output_modalities" :key="`out-${value}`" size="small" type="success" effect="plain">{{ value }}</el-tag>
          </span>
        </template>
        <template #cell-capabilities="{ row }">
          <div data-test="model-capabilities">
            <div v-for="value in capabilityLabels(row)" :key="value" data-test="model-capability">
              <el-tag size="small" type="info">{{ value }}</el-tag>
            </div>
            <span v-if="capabilityLabels(row).length === 0" class="official-model-page__muted">-</span>
          </div>
        </template>
        <template #cell-limits="{ row }">
          <dl data-test="model-limits" class="official-model-page__limits">
            <div><dt>{{ t('aiOfficialModel.labels.contextWindow') }}</dt><dd>{{ row.context_window_tokens }}</dd></div>
            <div><dt>{{ t('aiOfficialModel.labels.maxOutput') }}</dt><dd>{{ row.max_output_tokens }}</dd></div>
          </dl>
        </template>
        <template #cell-price="{ row }">
          <div v-if="row.effective.available" class="official-model-page__rates">
            <div v-for="rate in row.effective.rates" :key="`${rate.category}:${rate.unit}:${rate.tier_key}`" data-test="effective-rate" class="official-model-page__rate">
              <span data-test="effective-rate-label" class="official-model-page__rate-label">{{ categoryLabel(rate) }} · {{ tierLabel(rate) }}</span>
              <span data-test="effective-rate-price" class="official-model-page__rate-price">
                <strong>¥{{ rate.price }}</strong>
                <small>/ {{ unitLabel(rate) }}</small>
              </span>
            </div>
          </div>
          <span v-else class="official-model-page__muted">{{ t('aiOfficialModel.labels.unavailable') }}</span>
        </template>
        <template #cell-verification="{ row }">
        <div>
          <el-tag :type="isOverride(row) ? 'warning' : 'success'" size="small">{{ t(`aiOfficialModel.sources.${row.effective.source}`) }}</el-tag>
        </div>
          <span>{{ row.effective.verified_at || '-' }}</span>
        </template>
        <template #cell-actions="{ row }">
          <el-button data-test="view-model" link type="primary" :icon="View" @click="openDetail(row)">{{ t('common.actions.view') }}</el-button>
          <el-button v-if="canSyncPrice" data-test="sync-price" link type="primary" :icon="Refresh" @click="openDetail(row)">{{ t('aiOfficialModel.actions.syncPrice') }}</el-button>
          <el-button v-if="canSyncPrice && isOverride(row)" data-test="restore-price" link type="warning" :icon="RefreshLeft" :loading="restoringModelID === row.model_id" @click="restoreOfficialPrice(row)">{{ t('aiOfficialModel.actions.restore') }}</el-button>
        </template>
      </AppTable>
    </div>
    <OfficialModelDrawer
      v-model="drawerVisible"
      :item="selectedModel"
      :loading="drawerLoading"
      :saving="saving"
      :can-sync-price="canSyncPrice"
      @sync-price="syncPrice"
    />
  </div>
</template>

<style scoped src="./styles.css"></style>
