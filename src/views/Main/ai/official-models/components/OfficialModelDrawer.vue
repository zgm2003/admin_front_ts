<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'
import type {
  AiOfficialModelItem,
  AiOfficialModelRate,
  AiOfficialModelRateInput,
} from '@/api/ai/official-models'
import { useIsMobile } from '@/hooks/useResponsive'
import type { OfficialModelPriceSyncForm } from '../use-official-model-page'

const props = defineProps<{
  modelValue: boolean
  item: AiOfficialModelItem | null
  loading: boolean
  saving: boolean
  canSyncPrice: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'sync-price': [form: OfficialModelPriceSyncForm]
}>()

type EditableRate = AiOfficialModelRateInput

const { t } = useI18n()
const isMobile = useIsMobile()
const formRef = ref<FormInstance | null>(null)
const form = reactive({ rates: [] as EditableRate[], source_url: '', verified_at: '' })
const rules: FormRules = {
  source_url: [{ required: true, validator: validateSourceURL, trigger: 'blur' }],
  verified_at: [{ required: true, pattern: /^\d{4}-\d{2}-\d{2}$/, message: t('aiOfficialModel.validation.date'), trigger: 'change' }],
}

watch([() => props.modelValue, () => props.item], ([visible, item]) => {
  if (visible && item) resetForm()
}, { immediate: true })

function resetForm() {
  const effective = props.item?.effective
  form.rates = effective?.rates.map((rate) => ({ ...rate })) ?? []
  form.source_url = effective?.source_url ?? props.item?.pricing_source_url ?? ''
  form.verified_at = effective?.verified_at ?? ''
  formRef.value?.clearValidate()
}

function rateIdentity(rate: Pick<EditableRate, 'category' | 'unit' | 'tier_key'>): string {
  return `${rate.category}:${rate.unit}:${rate.tier_key}`
}

function officialPrice(rate: EditableRate): string {
  return props.item?.official.rates.find((candidate) => rateIdentity(candidate) === rateIdentity(rate))?.price ?? '-'
}

function categoryLabel(rate: AiOfficialModelRate | EditableRate): string {
  return t(`aiOfficialModel.categories.${rate.category}`)
}

function unitLabel(rate: Pick<EditableRate, 'unit' | 'unit_scale'>): string {
  return rate.unit === 'token' && rate.unit_scale === 1_000_000
    ? t('aiOfficialModel.units.millionTokens')
    : t('aiOfficialModel.units.scaled', { scale: rate.unit_scale, unit: rate.unit })
}

function priceRules() {
  return [
    { required: true, message: t('aiOfficialModel.validation.priceRequired'), trigger: 'blur' },
    { pattern: /^\d+(?:\.\d+)?$/, message: t('aiOfficialModel.validation.price'), trigger: 'blur' },
  ]
}

async function submit() {
  if (!props.canSyncPrice || !props.item || props.saving) return
  try {
    await formRef.value?.validate()
    emit('sync-price', {
      expected_version: props.item.effective.override_version,
      rates: form.rates.map((rate) => ({ ...rate, price: rate.price.trim() })),
      source_url: form.source_url.trim(),
      verified_at: form.verified_at,
    })
  } catch (error) {
    if (error instanceof Error) ElNotification.warning({ message: error.message })
  }
}

function validateSourceURL(_: unknown, value: string, callback: (error?: Error) => void) {
  try {
    const url = new URL(value)
    const hosts = props.item?.catalog_vendor === 'openai'
      ? ['openai.com']
      : props.item?.catalog_vendor === 'anthropic' ? ['anthropic.com', 'claude.com'] : []
    const hostname = url.hostname.toLowerCase()
    if (url.protocol !== 'https:' || url.username || url.password || url.port
      || !hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
      throw new Error('invalid source')
    }
    callback()
  } catch {
    callback(new Error(t('aiOfficialModel.validation.sourceUrl')))
  }
}
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    :title="item ? t('aiOfficialModel.drawer.title', { model: item.model_id }) : t('aiOfficialModel.drawer.fallbackTitle')"
    :size="isMobile ? '100%' : '720px'"
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
    @closed="resetForm"
  >
    <div class="official-model-drawer" :aria-busy="loading">
      <div v-if="loading" class="official-model-drawer__loading">{{ t('common.loading') }}</div>
      <template v-else-if="item">
        <section class="official-model-drawer__section">
          <h3>{{ t('aiOfficialModel.sections.identity') }}</h3>
          <dl class="official-model-drawer__facts">
            <div><dt>{{ t('aiOfficialModel.labels.modelId') }}</dt><dd><code>{{ item.model_id }}</code></dd></div>
            <div><dt>{{ t('aiOfficialModel.labels.vendor') }}</dt><dd>{{ item.catalog_vendor }}</dd></div>
            <div><dt>{{ t('aiOfficialModel.labels.family') }}</dt><dd>{{ item.model_family }}</dd></div>
            <div><dt>{{ t('aiOfficialModel.labels.lifecycle') }}</dt><dd><el-tag size="small">{{ t(`aiOfficialModel.lifecycle.${item.lifecycle_status}`) }}</el-tag></dd></div>
            <div><dt>{{ t('aiOfficialModel.labels.catalogVersion') }}</dt><dd>{{ item.catalog_version }}</dd></div>
            <div><dt>{{ t('aiOfficialModel.labels.aliases') }}</dt><dd>{{ item.aliases.join(', ') || '-' }}</dd></div>
          </dl>
        </section>

        <section class="official-model-drawer__section">
          <h3>{{ t('aiOfficialModel.sections.limits') }}</h3>
          <dl class="official-model-drawer__facts">
            <div><dt>{{ t('aiOfficialModel.labels.contextWindow') }}</dt><dd>{{ item.context_window_tokens }}</dd></div>
            <div><dt>{{ t('aiOfficialModel.labels.maxOutput') }}</dt><dd>{{ item.max_output_tokens }}</dd></div>
            <div><dt>{{ t('aiOfficialModel.labels.contextTier') }}</dt><dd>{{ item.context_tier_threshold_tokens || '-' }}</dd></div>
            <div><dt>{{ t('aiOfficialModel.labels.pricingProfile') }}</dt><dd>{{ item.pricing_profile }}</dd></div>
          </dl>
        </section>

        <section class="official-model-drawer__section">
          <h3>{{ t('aiOfficialModel.sections.modalities') }}</h3>
          <dl class="official-model-drawer__facts">
            <div><dt>{{ t('aiOfficialModel.labels.inputModalities') }}</dt><dd>{{ item.capabilities.input_modalities.join(', ') || '-' }}</dd></div>
            <div><dt>{{ t('aiOfficialModel.labels.outputModalities') }}</dt><dd>{{ item.capabilities.output_modalities.join(', ') || '-' }}</dd></div>
            <div><dt>{{ t('aiOfficialModel.labels.imageLimits') }}</dt><dd>{{ item.capabilities.image_input ? `${item.capabilities.image_input.max_files} / ${item.capabilities.image_input.max_bytes}` : '-' }}</dd></div>
            <div><dt>{{ t('aiOfficialModel.labels.imageMimes') }}</dt><dd>{{ item.capabilities.image_input?.mime_types.join(', ') || '-' }}</dd></div>
          </dl>
        </section>

        <section class="official-model-drawer__section">
          <h3>{{ t('aiOfficialModel.sections.capabilities') }}</h3>
          <div class="official-model-drawer__capabilities">
            <el-tag :type="item.capabilities.supports_tools ? 'success' : 'info'">{{ t('aiOfficialModel.capabilities.tools') }}</el-tag>
            <el-tag :type="item.capabilities.supports_streaming ? 'success' : 'info'">{{ t('aiOfficialModel.capabilities.streaming') }}</el-tag>
            <el-tag :type="item.capabilities.supports_structured_output ? 'success' : 'info'">{{ t('aiOfficialModel.capabilities.structuredOutput') }}</el-tag>
            <el-tag :type="item.capabilities.native_file_input ? 'success' : 'info'">{{ t('aiOfficialModel.capabilities.nativeFile') }}</el-tag>
            <el-tag v-for="parameter in item.capabilities.supported_parameters" :key="parameter" effect="plain">{{ parameter }}</el-tag>
          </div>
        </section>

        <section class="official-model-drawer__section">
          <div class="official-model-drawer__heading">
            <div><h3>{{ t('aiOfficialModel.sections.price') }}</h3><p>{{ t('aiOfficialModel.drawer.fixedKeys') }}</p></div>
            <el-tag :type="item.effective.source === 'override' ? 'warning' : 'success'">{{ t(`aiOfficialModel.sources.${item.effective.source}`) }}</el-tag>
          </div>
          <el-form ref="formRef" :model="form" :rules="rules" :disabled="!canSyncPrice || saving" label-position="top">
            <div class="official-model-drawer__rates">
              <div v-for="(rate, index) in form.rates" :key="rateIdentity(rate)" class="official-model-drawer__rate">
                <div><strong>{{ categoryLabel(rate) }}</strong><span>{{ rate.tier_key || t('aiOfficialModel.tiers.default') }}</span><small>{{ unitLabel(rate) }}</small></div>
                <div><span>{{ t('aiOfficialModel.drawer.officialBaseline') }}</span><strong>¥{{ officialPrice(rate) }}</strong></div>
                <el-form-item :label="t('aiOfficialModel.drawer.currentPrice')" :prop="`rates.${index}.price`" :rules="priceRules()">
                  <el-input v-model="rate.price" data-test="rate-price-input" inputmode="decimal" autocomplete="off"><template #prefix>¥</template></el-input>
                </el-form-item>
              </div>
            </div>
            <div class="official-model-drawer__price-evidence">
              <el-form-item :label="t('aiOfficialModel.fields.sourceUrl')" prop="source_url"><el-input v-model="form.source_url" autocomplete="off" placeholder="https://" /></el-form-item>
              <el-form-item :label="t('aiOfficialModel.fields.verifiedAt')" prop="verified_at"><el-date-picker v-model="form.verified_at" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
            </div>
          </el-form>
        </section>

        <section class="official-model-drawer__section">
          <h3>{{ t('aiOfficialModel.sections.sources') }}</h3>
          <dl class="official-model-drawer__sources">
            <div><dt>{{ t('aiOfficialModel.labels.modelSource') }}</dt><dd><el-link :href="item.model_source_url" target="_blank">{{ item.model_source_url }}</el-link></dd></div>
            <div><dt>{{ t('aiOfficialModel.labels.pricingSource') }}</dt><dd><el-link :href="item.pricing_source_url" target="_blank">{{ item.pricing_source_url }}</el-link></dd></div>
            <div><dt>{{ t('aiOfficialModel.labels.retrievedAt') }}</dt><dd>{{ item.retrieved_at }}</dd></div>
            <div><dt>{{ t('aiOfficialModel.labels.reviewAfter') }}</dt><dd>{{ item.review_after }}</dd></div>
          </dl>
        </section>
      </template>
    </div>
    <template #footer>
      <div class="official-model-drawer__footer">
        <el-button :icon="Close" :disabled="saving" @click="emit('update:modelValue', false)">{{ t('common.actions.close') }}</el-button>
        <el-button v-if="canSyncPrice" type="primary" :icon="Check" :loading="saving" :disabled="loading" @click="submit">{{ t('aiOfficialModel.actions.syncPrice') }}</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped src="./official-model-drawer.css"></style>
