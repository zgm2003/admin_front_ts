<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AiAgentCatalogRate, AiAgentProviderModelOption } from '@/api/ai/agents'

defineProps<{
  model: AiAgentProviderModelOption
  rates: Array<AiAgentCatalogRate & { reference_price: string }>
  multiplier: string
  mobile: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <section class="agent-model-pricing">
    <div class="agent-model-pricing__heading">
      <strong>{{ t('aiAgents.catalog.title') }}</strong>
      <span v-if="model.catalog_vendor && model.catalog_version">
        {{ model.catalog_vendor }} / {{ model.catalog_version }}
      </span>
    </div>
    <el-descriptions
      :column="mobile ? 1 : 2"
      border
      size="small"
    >
      <el-descriptions-item :label="t('aiAgents.catalog.transportModel')">
        {{ model.display_name }} ({{ model.model_id }})
      </el-descriptions-item>
      <el-descriptions-item :label="t('aiAgents.catalog.catalogModel')">
        {{ model.catalog_model_id }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('aiAgents.catalog.publishedMaxOutput')">
        {{ model.max_output_tokens }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('aiAgents.catalog.source')">
        <el-tag
          size="small"
          :type="model.price_source === 'override' ? 'warning' : 'success'"
        >
          {{ t(`aiAgents.catalog.sources.${model.price_source || 'official'}`) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item :label="t('aiAgents.catalog.verifiedAt')">
        {{ model.price_verified_at || '-' }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('aiAgents.catalog.multiplier')">
        × {{ multiplier || '-' }}
      </el-descriptions-item>
    </el-descriptions>
    <el-table
      v-if="rates.length"
      :data="rates"
      size="small"
      class="agent-model-pricing__rates"
    >
      <el-table-column
        prop="category"
        :label="t('aiAgents.catalog.category')"
      />
      <el-table-column
        prop="tier_key"
        :label="t('aiAgents.catalog.tier')"
      />
      <el-table-column
        prop="price"
        :label="t('aiAgents.catalog.basePrice')"
      >
        <template #default="{ row }">
          ¥{{ row.price }}
        </template>
      </el-table-column>
      <el-table-column
        prop="reference_price"
        :label="t('aiAgents.catalog.referencePrice')"
      >
        <template #default="{ row }">
          <strong v-if="row.reference_price">¥{{ row.reference_price }}</strong>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('aiAgents.catalog.unit')">
        <template #default="{ row }">
          {{ row.unit }} / {{ row.unit_scale }}
        </template>
      </el-table-column>
    </el-table>
    <el-empty
      v-else
      :image-size="48"
      :description="t('aiAgents.catalog.unavailable')"
    />
    <p class="agent-model-pricing__note">
      {{ t('aiAgents.catalog.referenceHint') }}
    </p>
  </section>
</template>

<style scoped>
.agent-model-pricing {
  margin-bottom: 18px;
  padding: 12px 0;
  border-top: 1px solid var(--el-border-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
}

.agent-model-pricing__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.agent-model-pricing__heading strong,
.agent-model-pricing__rates strong {
  color: var(--el-text-color-primary);
}

.agent-model-pricing__rates {
  margin-top: 10px;
}

.agent-model-pricing__rates strong {
  font-variant-numeric: tabular-nums;
}

.agent-model-pricing__note {
  margin: 8px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}
</style>
