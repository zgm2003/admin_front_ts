<script setup lang="ts">
import { nextTick, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CopyDocument, Delete, Download, Plus } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { PaymentRedeemCodeGenerateBatchResponse } from '@/api/payment/redeem-codes'
import { useCopy } from '@/hooks/useCopy'
import type { RedeemCodeGenerateForm } from '../composables/useRedeemCodePage'

const props = defineProps<{
  modelValue: boolean
  generating: boolean
  hasPendingRequest: boolean
  generate: (form: RedeemCodeGenerateForm) => Promise<PaymentRedeemCodeGenerateBatchResponse | undefined>
  exportBatch: (batchNo: string) => Promise<void>
  abandonPending: () => Promise<void>
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { t } = useI18n()
const { copy } = useCopy()
const formRef = ref<FormInstance>()
const exporting = ref(false)
const form = reactive<RedeemCodeGenerateForm>({
  amount: '',
  quantity: 1,
  expires_at: '',
  note: '',
})
const generated = shallowRef<PaymentRedeemCodeGenerateBatchResponse | null>(null)
let generationVersion = 0
const rules: FormRules<RedeemCodeGenerateForm> = {
  amount: [{ required: true, message: t('paymentRedeemCode.validation.amount'), trigger: 'blur' }],
  quantity: [{ required: true, message: t('paymentRedeemCode.validation.quantity'), trigger: 'change' }],
}

function validForm() {
  const amount = form.amount.trim()
  const amountValid = /^\d+(?:\.\d{1,2})?$/.test(amount)
    && Number(amount) > 0
  return amountValid
    && Number.isInteger(form.quantity)
    && form.quantity >= 1
    && form.quantity <= 1000
}

async function submit() {
  if (!validForm()) {
    ElMessage.warning(t('paymentRedeemCode.validation.invalid'))
    return
  }
  const valid = await formRef.value?.validate().catch(() => false)
  if (valid === false) return
  const version = ++generationVersion
  try {
    const result = await props.generate({ ...form })
    if (result && props.modelValue && version === generationVersion) generated.value = result
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('paymentRedeemCode.messages.generateFailed'))
  }
}

function copyAll() {
  const codes = generated.value?.codes.map(({ code }) => code) ?? []
  if (codes.length > 0) void copy(codes.join('\n'))
}

async function exportGeneratedBatch() {
  const batchNo = generated.value?.batch.batch_no
  if (!batchNo) return
  exporting.value = true
  try {
    await props.exportBatch(batchNo)
  } finally {
    exporting.value = false
  }
}

async function abandonPending() {
  await props.abandonPending()
}

function clearGenerated() {
  generationVersion += 1
  generated.value = null
}

function close() {
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) clearGenerated()
    if (visible) void nextTick(() => formRef.value?.clearValidate())
  },
)
onBeforeUnmount(clearGenerated)
</script>

<template>
  <el-dialog
    :model-value="props.modelValue"
    :title="t('paymentRedeemCode.generate.title')"
    width="min(760px, calc(100vw - 32px))"
    append-to-body
    destroy-on-close
    @closed="clearGenerated"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      @submit.prevent="submit"
    >
      <div class="redeem-generate-form">
        <el-form-item
          :label="t('paymentRedeemCode.generate.amount')"
          prop="amount"
        >
          <el-input
            v-model="form.amount"
            data-test="generate-amount"
            inputmode="decimal"
            :placeholder="t('paymentRedeemCode.generate.amountPlaceholder')"
          />
        </el-form-item>
        <el-form-item
          :label="t('paymentRedeemCode.generate.quantity')"
          prop="quantity"
        >
          <el-input-number
            v-model="form.quantity"
            data-test="generate-quantity"
            :min="1"
            :max="1000"
            :step="1"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item :label="t('paymentRedeemCode.generate.expiresAt')">
          <el-date-picker
            v-model="form.expires_at"
            data-test="generate-expires-at"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            :placeholder="t('paymentRedeemCode.generate.expiresAtPlaceholder')"
          />
        </el-form-item>
        <el-form-item
          class="redeem-generate-form__note"
          :label="t('paymentRedeemCode.generate.note')"
        >
          <el-input
            v-model="form.note"
            data-test="generate-note"
            type="textarea"
            :rows="2"
            maxlength="255"
            show-word-limit
            :placeholder="t('paymentRedeemCode.generate.notePlaceholder')"
          />
        </el-form-item>
      </div>
    </el-form>

    <section
      v-if="generated"
      class="redeem-generated"
      aria-live="polite"
    >
      <div class="redeem-generated__header">
        <div>
          <strong>{{ t('paymentRedeemCode.generate.resultTitle') }}</strong>
          <span>{{ generated.batch.batch_no }} · {{ generated.codes.length }}</span>
        </div>
        <div class="redeem-generated__actions">
          <el-button
            data-test="copy-generated-codes"
            :icon="CopyDocument"
            @click="copyAll"
          >
            {{ t('paymentRedeemCode.actions.copyAll') }}
          </el-button>
          <el-button
            data-test="export-generated-batch"
            :icon="Download"
            :loading="exporting"
            @click="exportGeneratedBatch"
          >
            {{ t('common.actions.export') }}
          </el-button>
        </div>
      </div>
      <ul class="redeem-generated__codes">
        <li
          v-for="item in generated.codes"
          :key="item.id"
        >
          <code>{{ item.code }}</code>
          <el-tooltip :content="t('paymentRedeemCode.actions.copyCode')">
            <el-button
              text
              circle
              :icon="CopyDocument"
              :aria-label="t('paymentRedeemCode.actions.copyCode')"
              @click="copy(item.code)"
            />
          </el-tooltip>
        </li>
      </ul>
    </section>

    <template #footer>
      <div class="redeem-generate-footer">
        <el-button
          v-if="props.hasPendingRequest"
          data-test="abandon-pending-request"
          type="danger"
          plain
          :icon="Delete"
          @click="abandonPending"
        >
          {{ t('paymentRedeemCode.actions.abandonPending') }}
        </el-button>
        <span class="redeem-generate-footer__spacer" />
        <el-button @click="close">
          {{ t('common.actions.close') }}
        </el-button>
        <el-button
          data-test="generate-submit"
          type="primary"
          :icon="Plus"
          :loading="props.generating"
          @click="submit"
        >
          {{ t('paymentRedeemCode.actions.generate') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.redeem-generate-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(150px, 0.55fr);
  gap: 0 16px;
  min-width: 0;
}

.redeem-generate-form__note {
  grid-column: 1 / -1;
}

.redeem-generate-form :deep(.el-input-number),
.redeem-generate-form :deep(.el-date-editor) {
  width: 100%;
}

.redeem-generated {
  min-width: 0;
  margin-top: 4px;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 14px;
}

.redeem-generated__header,
.redeem-generated__actions,
.redeem-generate-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.redeem-generated__header {
  justify-content: space-between;
  min-width: 0;
}

.redeem-generated__header > div:first-child {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.redeem-generated__header span {
  margin-top: 2px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.redeem-generated__codes {
  display: grid;
  gap: 6px;
  max-height: 280px;
  margin: 12px 0 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}

.redeem-generated__codes li {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 5px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-fill-color-light);
}

.redeem-generated__codes code {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.redeem-generate-footer__spacer {
  flex: 1 1 auto;
}

@media (max-width: 640px) {
  .redeem-generate-form {
    grid-template-columns: 1fr;
  }

  .redeem-generate-form__note {
    grid-column: auto;
  }

  .redeem-generated__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .redeem-generated__actions {
    width: 100%;
  }

  .redeem-generate-footer {
    flex-wrap: wrap;
  }

  .redeem-generate-footer__spacer {
    display: none;
  }
}
</style>
