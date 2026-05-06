<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { AppDialog } from '@/components/AppDialog'
import { RemoteSelect } from '@/components/RemoteSelect'
import { WalletAdjustmentApi } from '@/api/pay/wallet'
import { UsersListApi } from '@/api/user/users'
import { formatWalletUserLabel } from '../helpers'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormItemRule, FormRules } from 'element-plus'

const props = withDefaults(defineProps<{
  modelValue: boolean
  userId?: number | ''
}>(), {
  userId: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const { t } = useI18n()
const isMobile = useIsMobile()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const formRef = ref<FormInstance | null>(null)
const form = ref({
  user_id: '' as number | '',
  delta: 0 as number,
  reason: '',
})

type ValidateCallback = NonNullable<FormItemRule['validator']>
type ValidateDone = Parameters<ValidateCallback>[2]

const validateDelta: ValidateCallback = (_rule, value: unknown, callback: ValidateDone) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    callback(new Error(t('pay_wallet.form.delta') + t('common.required')))
    return
  }
  if (value === 0) {
    callback(new Error('调账金额不能为 0'))
    return
  }
  callback()
}

const rules = computed<FormRules>(() => ({
  user_id: [{ required: true, message: t('pay_wallet.form.user_id') + t('common.required'), trigger: 'change' }],
  delta: [{ required: true, validator: validateDelta, trigger: 'blur' }],
  reason: [
    { required: true, message: t('pay_wallet.form.reason') + t('common.required'), trigger: 'blur' },
    { max: 255, message: '调账原因不能超过 255 个字符', trigger: 'blur' },
  ],
}))

const createIdempotencyKey = () => {
  const idempotencyKey = globalThis.crypto?.randomUUID?.()
  if (!idempotencyKey) {
    ElNotification.error({ message: '当前浏览器不支持安全幂等键生成，请升级浏览器' })
    return ''
  }
  return idempotencyKey
}

const resetForm = () => {
  form.value = {
    user_id: props.userId ?? '',
    delta: 0,
    reason: '',
  }
}

const openDialog = () => {
  resetForm()
  nextTick(() => {
    void formRef.value?.clearValidate()
  })
}

const submit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  const idempotencyKey = createIdempotencyKey()
  if (!idempotencyKey) {
    return
  }

  await WalletAdjustmentApi.create({
    user_id: Number(form.value.user_id),
    delta: Math.round(form.value.delta * 100),
    reason: form.value.reason.trim(),
    idempotency_key: idempotencyKey,
  })

  ElNotification.success({ message: t('common.success.operation') })
  dialogVisible.value = false
  emit('success')
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      openDialog()
    }
  },
)
</script>

<template>
  <AppDialog
    v-model="dialogVisible"
    :width="isMobile ? '94vw' : '480px'"
    :title="t('pay_wallet.actions.adjust')"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="auto"
    >
      <el-form-item
        :label="t('pay_wallet.form.user_id')"
        prop="user_id"
        required
      >
        <RemoteSelect
          v-model="form.user_id"
          :fetch-method="UsersListApi.list"
          :label-field="formatWalletUserLabel"
          value-field="id"
          :placeholder="t('pay_wallet.form.userPlaceholder')"
          width="100%"
        />
      </el-form-item>
      <el-form-item
        :label="t('pay_wallet.form.delta')"
        prop="delta"
        required
      >
        <el-input-number
          v-model="form.delta"
          :precision="2"
          :step="1"
          style="width:100%"
        />
        <div class="adjust-hint">
          {{ t('pay_wallet.form.deltaHint') }}
        </div>
      </el-form-item>
      <el-form-item
        :label="t('pay_wallet.form.reason')"
        prop="reason"
        required
      >
        <el-input
          v-model="form.reason"
          type="textarea"
          :rows="3"
          maxlength="255"
          show-word-limit
          clearable
          style="width:100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button
          type="primary"
          @click="submit"
        >{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </AppDialog>
</template>

<style scoped>
.adjust-hint {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
}
</style>
