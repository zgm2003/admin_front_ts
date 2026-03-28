<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DictOption } from '@/types/common'
import type { RechargePresetOption } from '../types'

const props = defineProps<{
  amount: number | null
  channelId: number | null
  payMethod: string
  submitting: boolean
  canRecharge: boolean
  presetAmounts: RechargePresetOption[]
  channelOptions: DictOption<number>[]
  payMethodOptions: DictOption<string>[]
}>()

const emit = defineEmits<{
  'update:amount': [value: number | null]
  'update:channel-id': [value: number | null]
  'update:pay-method': [value: string]
  'select-preset': [value: number]
  submit: []
}>()

const { t } = useI18n()

const configMissing = computed(() => props.channelOptions.length === 0 || props.payMethodOptions.length === 0)

const presetLabel = (item: RechargePresetOption) => item.label ?? `¥${item.amount}`

const onAmountChange = (value: number | undefined) => {
  emit('update:amount', value ?? null)
}

const onChannelChange = (value: number | undefined) => {
  emit('update:channel-id', value ?? null)
}
</script>

<template>
  <el-card shadow="never" class="recharge-card">
    <template #header>
      <div class="section-header">
        <div class="section-title">{{ t('personal.recharge.formTitle') }}</div>
        <div class="section-subtitle">{{ t('personal.recharge.formDesc') }}</div>
      </div>
    </template>

    <el-alert
      v-if="configMissing"
      :title="t('personal.recharge.configHint')"
      type="warning"
      :closable="false"
      show-icon
      class="state-alert"
    />

    <div class="form-body">
      <div class="preset-block">
        <div class="block-label">{{ t('personal.recharge.preset') }}</div>
        <div class="preset-list">
          <el-button
            v-for="item in presetAmounts"
            :key="item.amount"
            class="preset-button"
            :type="amount === item.amount ? 'primary' : 'default'"
            :plain="amount !== item.amount"
            @click="emit('select-preset', item.amount)"
          >
            {{ presetLabel(item) }}
          </el-button>
        </div>
      </div>

      <el-form label-position="top" label-width="auto">
        <div class="field-grid">
          <el-form-item :label="t('personal.recharge.channel')">
            <el-select-v2
              :model-value="channelId ?? undefined"
              :options="channelOptions"
              class="field-control"
              @update:model-value="onChannelChange"
            />
          </el-form-item>

          <el-form-item :label="t('personal.recharge.payMethod')">
            <el-select-v2
              :model-value="payMethod || undefined"
              :options="payMethodOptions"
              class="field-control"
              @update:model-value="emit('update:pay-method', $event ?? '')"
            />
          </el-form-item>
        </div>

        <el-form-item :label="t('personal.recharge.customAmount')">
          <el-input-number
            :model-value="amount ?? undefined"
            :min="0.01"
            :precision="2"
            :step="10"
            controls-position="right"
            class="field-control"
            @update:model-value="onAmountChange"
          />
        </el-form-item>
      </el-form>

      <div class="form-footer">
        <el-button
          type="primary"
          class="submit-button"
          :loading="submitting"
          :disabled="!canRecharge"
          @click="emit('submit')"
        >
          {{ t('personal.recharge.submit') }}
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.recharge-card {
  height: 100%;
  border-radius: 18px;
  border: 1px solid var(--el-border-color-lighter);
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.section-subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.state-alert {
  margin-bottom: 16px;
}

.block-label {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.preset-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  align-items: stretch;
}

.preset-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  height: 40px;
  margin-left: 0;
  padding: 0 16px;
  border-radius: 14px;
}

.preset-list :deep(.el-button + .el-button) {
  margin-left: 0;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field-control {
  width: 100%;
}

.form-footer {
  display: flex;
  justify-content: flex-start;
}

.submit-button {
  min-width: 144px;
  border-radius: 14px;
}

@media (max-width: 768px) {
  .recharge-card {
    border-radius: 16px;
  }

  .preset-list,
  .field-grid {
    grid-template-columns: 1fr;
  }

  .preset-button {
    height: 38px;
    border-radius: 12px;
  }

  .submit-button {
    width: 100%;
  }
}
</style>
