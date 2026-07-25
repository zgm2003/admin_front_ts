<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Ticket } from '@element-plus/icons-vue'
import { WalletApi, type WalletRedemptionResponse } from '@/api/wallet'
import { isApiError } from '@/modules/http/error'

const props = defineProps<{
  modelValue: boolean
}>()
const emit = defineEmits<{
  redeemed: [result: WalletRedemptionResponse]
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()
const code = ref('')
const errorKey = ref('')
const inputRef = ref<{ focus: () => void }>()
const submitting = ref(false)

async function submit() {
  if (submitting.value) return
  if (!code.value.trim()) {
    errorKey.value = 'wallet.redeem.errors.unavailable'
    return
  }

  submitting.value = true
  errorKey.value = ''
  try {
    const result = await WalletApi.redeem({ code: code.value.trim() })
    code.value = ''
    emit('update:modelValue', false)
    emit('redeemed', result)
  } catch (error) {
    errorKey.value = redeemErrorKey(error)
  } finally {
    submitting.value = false
  }
}

function close() {
  if (submitting.value) return
  code.value = ''
  errorKey.value = ''
  emit('update:modelValue', false)
}

function updateVisible(visible: boolean) {
  if (visible) {
    emit('update:modelValue', true)
    return
  }
  close()
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      code.value = ''
      errorKey.value = ''
      return
    }
    void nextTick(() => inputRef.value?.focus())
  },
)

function redeemErrorKey(error: unknown) {
  if (!isApiError(error)) return 'wallet.redeem.errors.resultUncertain'

  const code = error.code?.split('.').at(-1)
  if (
    error.status === 503
    || code === 'rate_limit_unavailable'
    || code === 'dependency_unavailable'
  ) {
    return 'wallet.redeem.errors.serviceUnavailable'
  }
  if (error.status === 429 || error.kind === 'rate-limit') {
    return 'wallet.redeem.errors.tooFrequent'
  }
  if (
    error.status === 400
    || code === 'code_required'
    || code === 'unavailable'
  ) {
    return 'wallet.redeem.errors.unavailable'
  }
  return 'wallet.redeem.errors.resultUncertain'
}
</script>

<template>
  <el-dialog
    :model-value="props.modelValue"
    :title="t('wallet.redeem.title')"
    width="min(420px, calc(100vw - 24px))"
    append-to-body
    destroy-on-close
    :close-on-click-modal="!submitting"
    :close-on-press-escape="!submitting"
    :show-close="!submitting"
    @update:model-value="updateVisible"
  >
    <el-form @submit.prevent="submit">
      <el-form-item :label="t('wallet.redeem.codeLabel')">
        <el-input
          ref="inputRef"
          v-model="code"
          data-test="redeem-code-input"
          autocomplete="off"
          autofocus
          :disabled="submitting"
          maxlength="128"
          :placeholder="t('wallet.redeem.codePlaceholder')"
          :spellcheck="false"
          @keyup.enter="submit"
        />
      </el-form-item>
    </el-form>

    <el-alert
      v-if="errorKey"
      class="wallet-redeem-dialog__error"
      :title="t(errorKey)"
      type="error"
      :closable="false"
      show-icon
    />

    <template #footer>
      <div class="wallet-redeem-dialog__footer">
        <el-button
          :disabled="submitting"
          @click="close"
        >
          {{ t('common.actions.cancel') }}
        </el-button>
        <el-button
          data-test="redeem-code-submit"
          type="primary"
          :icon="Ticket"
          :loading="submitting"
          :disabled="submitting"
          @click="submit"
        >
          {{ t('wallet.redeem.submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.wallet-redeem-dialog__error {
  margin-top: 4px;
}

.wallet-redeem-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 480px) {
  .wallet-redeem-dialog__footer {
    width: 100%;
  }

  .wallet-redeem-dialog__footer :deep(.el-button) {
    flex: 1 1 0;
    min-width: 0;
  }
}
</style>
