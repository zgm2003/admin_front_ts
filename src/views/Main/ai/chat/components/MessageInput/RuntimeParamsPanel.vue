<script setup lang="ts">
import { RefreshRight } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { AiAgentEffectiveCapabilities } from '@/api/ai/agents'
import type { RuntimeParameterDraft } from './runtime-params'

const props = defineProps<{
  capabilities: AiAgentEffectiveCapabilities
  hasCustomParams: boolean
}>()
const emit = defineEmits<{ reset: [] }>()
const temperature = defineModel<RuntimeParameterDraft>('temperature', { required: true })
const { t } = useI18n()

function updateTemperature(patch: Partial<RuntimeParameterDraft>) {
  temperature.value = { ...temperature.value, ...patch }
}

</script>

<template>
  <div class="params-panel">
    <div class="params-header">
      <span class="params-title">{{ t('aiChat.runtimeParams') }}</span>
      <button
        class="params-reset-btn"
        :class="{ active: hasCustomParams }"
        @click="emit('reset')"
      >
        <el-icon :size="12">
          <RefreshRight />
        </el-icon>
        {{ t('aiChat.resetParams') }}
      </button>
    </div>
    <div class="params-items">
      <div
        v-if="props.capabilities.runtime_parameters.temperature.supported"
        class="params-item"
        data-test="temperature-param"
      >
        <div class="params-item-header">
          <span class="params-item-label">
            {{ t('aiChat.temperature') }}
            <el-switch
              data-test="temperature-enabled"
              :model-value="temperature.enabled"
              size="small"
              @update:model-value="(value: string | number | boolean) => updateTemperature({ enabled: value === true })"
            />
          </span>
          <span
            class="params-item-value"
            :class="{ custom: temperature.enabled }"
          >
            {{ temperature.enabled ? temperature.value.toFixed(1) : t('aiChat.useDefault') }}
          </span>
        </div>
        <el-slider
          :model-value="temperature.value"
          :min="props.capabilities.runtime_parameters.temperature.min"
          :max="props.capabilities.runtime_parameters.temperature.max"
          :step="0.1"
          :disabled="!temperature.enabled"
          :show-tooltip="false"
          size="small"
          @update:model-value="(value: number | number[]) => updateTemperature({ value: value as number })"
        />
      </div>
    </div>
  </div>
</template>

<style scoped src="./runtime-params-panel.css"></style>
