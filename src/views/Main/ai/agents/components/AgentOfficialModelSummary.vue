<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AiAgentCatalogRate, AiAgentProviderModelOption } from '@/api/ai/agents'

const props = defineProps<{
  model: AiAgentProviderModelOption
  rates: Array<AiAgentCatalogRate & { reference_price: string }>
  multiplier: string
  mobile: boolean
}>()

const { t } = useI18n()
const official = computed(() => props.model.official_model)
const capabilities = computed(() => props.model.capabilities)
const lifecycleType = computed(() => official.value?.lifecycle_status === 'active'
  ? 'success' : official.value?.lifecycle_status === 'deprecated' ? 'warning' : 'danger')
</script>

<template>
  <section class="agent-official-model">
    <div class="agent-official-model__heading">
      <div>
        <strong>{{ t('aiAgents.official.title') }}</strong>
        <span>{{ model.display_name || model.model_id }}</span>
      </div>
      <el-tag
        v-if="official"
        :data-test="`lifecycle-${official.lifecycle_status}`"
        :type="lifecycleType"
        size="small"
      >
        {{ t(`aiAgents.official.lifecycle.${official.lifecycle_status}`) }}
      </el-tag>
    </div>

    <p v-if="official?.lifecycle_status === 'deprecated'" class="agent-official-model__warning">
      {{ t('aiAgents.official.deprecatedWarning') }}
    </p>
    <p v-if="official?.lifecycle_status === 'retired'" class="agent-official-model__warning agent-official-model__warning--danger">
      {{ t('aiAgents.official.retiredWarning') }}
    </p>

    <el-descriptions v-if="official" :column="mobile ? 1 : 2" border size="small">
      <el-descriptions-item :label="t('aiAgents.official.transportModel')">{{ model.model_id }}</el-descriptions-item>
      <el-descriptions-item :label="t('aiAgents.official.modelId')">{{ official.model_id }}</el-descriptions-item>
      <el-descriptions-item :label="t('aiAgents.official.catalogVersion')">{{ official.catalog_version }}</el-descriptions-item>
      <el-descriptions-item :label="t('aiAgents.official.vendor')">{{ official.catalog_vendor }}</el-descriptions-item>
      <el-descriptions-item :label="t('aiAgents.official.contextWindow')">{{ official.context_window_tokens }}</el-descriptions-item>
      <el-descriptions-item :label="t('aiAgents.official.maxOutput')">{{ official.max_output_tokens }}</el-descriptions-item>
      <el-descriptions-item :label="t('aiAgents.official.inputModalities')">{{ capabilities?.input_modalities.join(', ') || '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('aiAgents.official.outputModalities')">{{ capabilities?.output_modalities.join(', ') || '-' }}</el-descriptions-item>
    </el-descriptions>

    <div v-if="capabilities" class="agent-official-model__capabilities">
      <el-tag :type="capabilities.supports_tools ? 'success' : 'info'" size="small">tools</el-tag>
      <el-tag :type="capabilities.supports_streaming ? 'success' : 'info'" size="small">streaming</el-tag>
      <el-tag :type="capabilities.attachments.image.enabled ? 'success' : 'info'" size="small">image</el-tag>
      <el-tag :type="capabilities.runtime_parameters.temperature.supported ? 'success' : 'info'" size="small">temperature</el-tag>
    </div>

    <div class="agent-official-model__price-heading">
      <span>{{ t('aiAgents.official.priceSource') }}: {{ t(`aiAgents.official.sources.${model.price_source || 'official'}`) }}</span>
      <span>{{ t('aiAgents.official.multiplier') }}: × {{ multiplier || '-' }}</span>
    </div>
    <el-table v-if="rates.length" :data="rates" size="small" class="agent-official-model__rates">
      <el-table-column prop="category" :label="t('aiAgents.official.category')" />
      <el-table-column prop="tier_key" :label="t('aiAgents.official.tier')" />
      <el-table-column prop="price" :label="t('aiAgents.official.basePrice')"><template #default="{ row }">¥{{ row.price }}</template></el-table-column>
      <el-table-column prop="reference_price" :label="t('aiAgents.official.referencePrice')"><template #default="{ row }"><strong v-if="row.reference_price">¥{{ row.reference_price }}</strong><span v-else>-</span></template></el-table-column>
      <el-table-column :label="t('aiAgents.official.unit')"><template #default="{ row }">{{ row.unit }} / {{ row.unit_scale }}</template></el-table-column>
    </el-table>
    <p v-else class="agent-official-model__empty">{{ t('aiAgents.official.unavailable') }}</p>
    <p class="agent-official-model__note">{{ t('aiAgents.official.referenceHint') }}</p>
  </section>
</template>

<style scoped>
.agent-official-model { padding: 12px 0 4px; border-top: 1px solid var(--el-border-color-light); }
.agent-official-model__heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.agent-official-model__heading > div { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.agent-official-model__heading span,
.agent-official-model__price-heading,
.agent-official-model__empty,
.agent-official-model__note { color: var(--el-text-color-secondary); font-size: 12px; }
.agent-official-model__warning { margin: 0 0 10px; padding: 8px 10px; border-left: 3px solid var(--el-color-warning); background: var(--el-color-warning-light-9); color: var(--el-color-warning-dark-2); font-size: 13px; }
.agent-official-model__warning--danger { border-left-color: var(--el-color-danger); background: var(--el-color-danger-light-9); color: var(--el-color-danger); }
.agent-official-model__capabilities { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.agent-official-model__price-heading { display: flex; justify-content: space-between; gap: 12px; margin-top: 14px; }
.agent-official-model__rates { margin-top: 8px; }
.agent-official-model__rates strong { font-variant-numeric: tabular-nums; }
.agent-official-model__empty { margin: 10px 0 0; }
.agent-official-model__note { margin: 8px 0 0; line-height: 1.5; }
</style>
