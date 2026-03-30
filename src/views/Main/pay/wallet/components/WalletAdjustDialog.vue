<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { RemoteSelect } from '@/components/RemoteSelect'
import { UserWalletApi } from '@/api/pay/wallet'
import { UsersListApi } from '@/api/user/users'
import { formatWalletUserLabel } from '../helpers'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

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

const rules = computed<FormRules>(() => ({
  user_id: [{ required: true, message: t('pay_wallet.form.user_id') + t('common.required'), trigger: 'change' }],
  delta: [{ required: true, message: t('pay_wallet.form.delta') + t('common.required'), trigger: 'blur' }],
}))

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

  await UserWalletApi.adjust({
    user_id: Number(form.value.user_id),
    delta: Math.round(form.value.delta * 100),
    reason: form.value.reason,
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
  <el-dialog v-model="dialogVisible" :width="isMobile ? '94vw' : '480px'" :title="t('pay_wallet.actions.adjust')">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto">
      <el-form-item :label="t('pay_wallet.form.user_id')" prop="user_id" required>
        <RemoteSelect
          v-model="form.user_id"
          :fetch-method="UsersListApi.list"
          :label-field="formatWalletUserLabel"
          value-field="id"
          :placeholder="t('pay_wallet.form.userPlaceholder')"
          width="100%"
        />
      </el-form-item>
      <el-form-item :label="t('pay_wallet.form.delta')" prop="delta" required>
        <el-input-number v-model="form.delta" :precision="2" :step="1" style="width:100%" />
        <div class="adjust-hint">{{ t('pay_wallet.form.deltaHint') }}</div>
      </el-form-item>
      <el-form-item :label="t('pay_wallet.form.reason')">
        <el-input v-model="form.reason" type="textarea" :rows="3" clearable style="width:100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="submit">{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.adjust-hint {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
}
</style>
