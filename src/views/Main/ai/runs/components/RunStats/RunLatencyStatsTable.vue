<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AiRunLatencyDistribution, AiRunLatencyStatsItem } from '@/api/ai/runs'
import { formatRunLatencyPercentile } from '../RunList/presenters'

defineProps<{
  rows: AiRunLatencyStatsItem[]
}>()
const { t } = useI18n()

const qualityType = (distribution: AiRunLatencyDistribution) =>
  distribution.insufficient_sample ? 'warning' : 'success'
const qualityText = (distribution: AiRunLatencyDistribution) => t(
  distribution.insufficient_sample ? 'aiRuns.stats.insufficientSample' : 'aiRuns.stats.sufficientSample',
)
</script>

<template>
  <div
    v-if="rows.length > 0"
    class="latency-table-scroll"
  >
    <table class="latency-stats-table">
      <thead>
        <tr>
          <th rowspan="2">
            {{ t('aiRuns.stats.provider') }}
          </th>
          <th rowspan="2">
            {{ t('aiRuns.stats.model') }}
          </th>
          <th colspan="4">
            {{ t('aiRuns.stats.ttft') }}
          </th>
          <th colspan="4">
            {{ t('aiRuns.stats.providerTotal') }}
          </th>
          <th rowspan="2">
            {{ t('aiRuns.stats.sampleQuality') }}
          </th>
        </tr>
        <tr>
          <th>P50</th>
          <th>P95</th>
          <th>P99</th>
          <th>{{ t('aiRuns.stats.samples') }}</th>
          <th>P50</th>
          <th>P95</th>
          <th>P99</th>
          <th>{{ t('aiRuns.stats.samples') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="`${row.provider_id}:${row.model_id}`"
          data-test="latency-stats-row"
        >
          <td>{{ row.provider_name || row.provider_id }}</td>
          <td><code>{{ row.model_id || '-' }}</code></td>
          <td>{{ formatRunLatencyPercentile(row.ttft, 'p50_ms') }}</td>
          <td>{{ formatRunLatencyPercentile(row.ttft, 'p95_ms') }}</td>
          <td>{{ formatRunLatencyPercentile(row.ttft, 'p99_ms') }}</td>
          <td>{{ row.ttft.sample_count }}</td>
          <td>{{ formatRunLatencyPercentile(row.provider_total, 'p50_ms') }}</td>
          <td>{{ formatRunLatencyPercentile(row.provider_total, 'p95_ms') }}</td>
          <td>{{ formatRunLatencyPercentile(row.provider_total, 'p99_ms') }}</td>
          <td>{{ row.provider_total.sample_count }}</td>
          <td class="sample-quality-cell">
            <div class="sample-quality">
              <span>TTFT</span>
              <el-tag
                size="small"
                :type="qualityType(row.ttft)"
              >
                {{ qualityText(row.ttft) }}
              </el-tag>
              <span>{{ t('aiRuns.stats.providerShort') }}</span>
              <el-tag
                size="small"
                :type="qualityType(row.provider_total)"
              >
                {{ qualityText(row.provider_total) }}
              </el-tag>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <el-empty
    v-else
    :description="t('aiRuns.stats.noLatencyData')"
  />
</template>

<style scoped>
.latency-table-scroll {
  overflow-x: auto;
  border-block: 1px solid var(--el-border-color-lighter);
}

.latency-stats-table {
  width: 100%;
  min-width: 1080px;
  border-collapse: collapse;
  color: var(--el-text-color-regular);
  font-size: 13px;
  table-layout: fixed;
}

.latency-stats-table th,
.latency-stats-table td {
  padding: 9px 10px;
  border-right: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.latency-stats-table th {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-weight: 600;
}

.latency-stats-table th:first-child,
.latency-stats-table th:nth-child(2),
.latency-stats-table td:first-child,
.latency-stats-table td:nth-child(2) {
  text-align: left;
}

.latency-stats-table th:first-child {
  width: 150px;
}

.latency-stats-table th:nth-child(2) {
  width: 180px;
}

.latency-stats-table th:last-child,
.latency-stats-table td:last-child {
  border-right: 0;
}

.latency-stats-table tbody tr:last-child td {
  border-bottom: 0;
}

.sample-quality-cell {
  width: 150px;
  text-align: left !important;
}

.sample-quality {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  gap: 5px 8px;
}

.sample-quality > span:not(.el-tag) {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}
</style>
