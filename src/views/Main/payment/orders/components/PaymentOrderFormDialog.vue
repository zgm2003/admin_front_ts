<script setup lang="ts">
import { ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { PaymentOrderInitResponse } from '@/api/payment/orders'
import type { PaymentOrderFormModel } from '../composables/usePaymentOrderPage'

const props = defineProps<{
  dict: PaymentOrderInitResponse['dict']
  configOptions: PaymentOrderInitResponse['config_options']
  rules: FormRules
}>()

const form = defineModel<PaymentOrderFormModel>({ required: true })
const formRef = ref<FormInstance | null>(null)

async function validate(): Promise<boolean> {
  if (!formRef.value) return false
  return formRef.value.validate()
}

function clearValidate() {
  formRef.value?.clearValidate()
}

defineExpose({
  validate,
  clearValidate,
})
</script>

<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="props.rules"
    label-width="auto"
    :validate-on-rule-change="false"
  >
    <section class="payment-order-form-dialog__section">
      <div class="payment-order-form-dialog__title">
        基础信息
      </div>
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item label="支付配置" prop="config_code" required>
            <el-select-v2
              v-model="form.config_code"
              :options="props.configOptions"
              filterable
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="支付方式" prop="pay_method" required>
            <el-select-v2
              v-model="form.pay_method"
              :options="props.dict.pay_method_arr"
              filterable
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="订单标题" prop="subject" required>
            <el-input
              v-model="form.subject"
              clearable
              maxlength="128"
              placeholder="请输入订单标题"
            />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="订单金额" prop="amount_yuan" required>
            <el-input
              v-model="form.amount_yuan"
              clearable
              placeholder="单位：元，如 9.90"
            >
              <template #append>元</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="过期分钟" prop="expire_minutes" required>
            <el-input-number
              v-model="form.expire_minutes"
              :controls="false"
              :min="1"
              :max="1440"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="同步返回地址" prop="return_url">
            <el-input
              v-model="form.return_url"
              clearable
              placeholder="https://your-domain.example/payment/return"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </section>
  </el-form>
</template>

<style scoped>
.payment-order-form-dialog__section {
  padding: 4px 2px 0;
}

.payment-order-form-dialog__title {
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
