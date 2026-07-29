<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'
import type {
  AiModelPriceItem,
  AiModelPriceRate,
  AiModelPriceRateInput,
} from '@/api/ai/model-prices'
import { useIsMobile } from '@/hooks/useResponsive'
import type { ModelPriceOverrideForm } from '../use-model-pricing-page'

const props = defineProps<{
  modelValue: boolean
  item: AiModelPriceItem | null
  loading: boolean
  saving: boolean
  canEdit: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [form: ModelPriceOverrideForm]
}>()

interface EditableRate {
  category: string
  price: string
  tier_key: string
  unit: string
  unit_scale: number
}

const { t } = useI18n()
const isMobile = useIsMobile()
const formRef = ref<FormInstance | null>(null)
const form = reactive({
  rates: [] as EditableRate[],
  source_url: '',
  verified_at: '',
})

const rules: FormRules = {
  source_url: [{ required: true, validator: validateSourceURL, trigger: 'blur' }],
  verified_at: [{ required: true, pattern: /^\d{4}-\d{2}-\d{2}$/, message: t('aiModelPricing.validation.date'), trigger: 'change' }],
}

watch(
  [() => props.modelValue, () => props.item],
  ([visible, item]) => {
    if (visible && item) resetForm()
  },
  { immediate: true },
)

function resetForm() {
  const effective = props.item?.effective
  form.rates = effective?.rates.map((rate) => ({ ...rate })) ?? []
  form.source_url = effective?.source_url ?? ''
  form.verified_at = effective?.verified_at ?? ''
  formRef.value?.clearValidate()
}

function rateIdentity(rate: Pick<EditableRate, 'category' | 'unit' | 'tier_key'>): string {
  return `${rate.category}:${rate.unit}:${rate.tier_key}`
}

function officialPrice(rate: EditableRate): string {
  const matched = props.item?.official.rates.find((candidate) => (
    rateIdentity(candidate) === rateIdentity(rate)
  ))
  return matched?.price ?? '-'
}

function unitLabel(rate: Pick<EditableRate, 'unit' | 'unit_scale'>): string {
  if (rate.unit === 'token' && rate.unit_scale === 1_000_000) {
    return t('aiModelPricing.units.millionTokens')
  }
  return t('aiModelPricing.units.scaled', { scale: rate.unit_scale, unit: rate.unit })
}

function priceRules() {
  return [
    { required: true, message: t('aiModelPricing.validation.priceRequired'), trigger: 'blur' },
    { pattern: /^\d+(?:\.\d+)?$/, message: t('aiModelPricing.validation.price'), trigger: 'blur' },
  ]
}

function isEditableCategory(value: string): value is AiModelPriceRateInput['category'] {
  return value === 'input'
    || value === 'output'
    || value === 'cache_read'
    || value === 'cache_write'
}

function toRateInput(rate: EditableRate): AiModelPriceRateInput {
  if (!isEditableCategory(rate.category)) {
    throw new Error(`unsupported model price rate category: ${rate.category}`)
  }
  return {
    category: rate.category,
    price: rate.price.trim(),
    tier_key: rate.tier_key,
    unit: rate.unit,
    unit_scale: rate.unit_scale,
  }
}

async function submit() {
  if (!props.canEdit || !props.item || props.saving) return
  try {
    await formRef.value?.validate()
    emit('save', {
      expected_version: props.item.effective.override_version,
      rates: form.rates.map(toRateInput),
      source_url: form.source_url.trim(),
      verified_at: form.verified_at,
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('unsupported model price')) {
      ElNotification.warning({ message: t('aiModelPricing.validation.unsupportedRate') })
    }
  }
}

function validateSourceURL(_: unknown, value: string, callback: (error?: Error) => void) {
  try {
    const url = new URL(value)
    const vendor = props.item?.catalog_vendor
    const allowedHosts = vendor === 'openai'
      ? ['openai.com']
      : vendor === 'anthropic'
        ? ['anthropic.com', 'claude.com']
        : []
    const hostname = url.hostname.toLowerCase()
    const allowed = allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))
    if (
      url.protocol !== 'https:'
      || url.username
      || url.password
      || url.port
      || !allowed
    ) throw new Error('invalid official source')
    callback()
  } catch {
    callback(new Error(t('aiModelPricing.validation.sourceUrl')))
  }
}

function categoryLabel(rate: AiModelPriceRate | EditableRate): string {
  return t(`aiModelPricing.categories.${rate.category}`)
}
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    :title="item ? t('aiModelPricing.drawer.title', { model: item.model_id }) : t('aiModelPricing.drawer.fallbackTitle')"
    :size="isMobile ? '100%' : '640px'"
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
    @closed="resetForm"
  >
    <div
      class="model-price-drawer"
      :aria-busy="loading"
    >
      <div
        v-if="loading"
        class="model-price-drawer__loading"
      >
        {{ t('common.loading') }}
      </div>

      <el-form
        v-else-if="item"
        ref="formRef"
        :model="form"
        :rules="rules"
        :disabled="!canEdit || saving"
        label-position="top"
      >
        <div class="model-price-drawer__context">
          <div>
            <span>{{ t('aiModelPricing.drawer.vendor') }}</span>
            <strong>{{ item.catalog_vendor }}</strong>
          </div>
          <div>
            <span>{{ t('aiModelPricing.drawer.catalogVersion') }}</span>
            <strong>{{ item.catalog_version }}</strong>
          </div>
          <div>
            <span>{{ t('aiModelPricing.drawer.currentSource') }}</span>
            <el-tag
              size="small"
              :type="item.effective.source === 'override' ? 'warning' : 'success'"
            >
              {{ t(`aiModelPricing.sources.${item.effective.source}`) }}
            </el-tag>
          </div>
        </div>

        <section class="model-price-drawer__section">
          <div class="model-price-drawer__section-heading">
            <div>
              <strong>{{ t('aiModelPricing.drawer.rates') }}</strong>
              <span>{{ t('aiModelPricing.drawer.fixedKeys') }}</span>
            </div>
            <el-tag
              size="small"
              effect="plain"
            >
              {{ t('aiModelPricing.drawer.rateCount', { count: form.rates.length }) }}
            </el-tag>
          </div>

          <div class="model-price-drawer__rates">
            <div
              v-for="(rate, index) in form.rates"
              :key="rateIdentity(rate)"
              class="model-price-drawer__rate"
            >
              <div class="model-price-drawer__rate-key">
                <strong>{{ categoryLabel(rate) }}</strong>
                <span>{{ rate.tier_key || t('aiModelPricing.tiers.default') }}</span>
                <small>{{ unitLabel(rate) }}</small>
              </div>
              <div class="model-price-drawer__official">
                <span>{{ t('aiModelPricing.drawer.officialBaseline') }}</span>
                <strong>¥{{ officialPrice(rate) }}</strong>
              </div>
              <el-form-item
                :label="t('aiModelPricing.drawer.currentPrice')"
                :prop="`rates.${index}.price`"
                :rules="priceRules()"
              >
                <el-input
                  v-model="rate.price"
                  data-test="rate-price-input"
                  inputmode="decimal"
                  autocomplete="off"
                >
                  <template #prefix>
                    ¥
                  </template>
                </el-input>
              </el-form-item>
            </div>
          </div>
        </section>

        <section class="model-price-drawer__section model-price-drawer__source">
          <div class="model-price-drawer__section-heading">
            <div>
              <strong>{{ t('aiModelPricing.drawer.verification') }}</strong>
              <span>{{ t('aiModelPricing.drawer.verificationHint') }}</span>
            </div>
          </div>
          <el-form-item
            :label="t('aiModelPricing.fields.sourceUrl')"
            prop="source_url"
          >
            <el-input
              v-model="form.source_url"
              autocomplete="off"
              placeholder="https://"
            />
          </el-form-item>
          <el-form-item
            :label="t('aiModelPricing.fields.verifiedAt')"
            prop="verified_at"
          >
            <el-date-picker
              v-model="form.verified_at"
              type="date"
              value-format="YYYY-MM-DD"
              :placeholder="t('aiModelPricing.fields.verifiedAt')"
              style="width: 100%"
            />
          </el-form-item>
        </section>
      </el-form>
    </div>

    <template #footer>
      <div class="model-price-drawer__footer">
        <el-button
          :icon="Close"
          :disabled="saving"
          @click="emit('update:modelValue', false)"
        >
          {{ t('common.actions.cancel') }}
        </el-button>
        <el-button
          v-if="canEdit"
          type="primary"
          :icon="Check"
          :loading="saving"
          :disabled="loading"
          @click="submit"
        >
          {{ t('common.actions.save') }}
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped src="./ModelPriceDrawer.css"></style>
