<script setup lang="ts">
import { RefreshRight } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

defineProps<{ hasCustomParams: boolean }>()
const emit = defineEmits<{ reset: [] }>()
const temperature = defineModel<number | null>('temperature', { required: true })
const maxTokens = defineModel<number | null>('maxTokens', { required: true })
const maxHistory = defineModel<number | null>('maxHistory', { required: true })
const { t } = useI18n()
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
      <div class="params-item">
        <div class="params-item-header">
          <span class="params-item-label">{{ t('aiChat.temperature') }}</span>
          <span
            class="params-item-value"
            :class="{ custom: temperature !== null }"
          >
            {{ temperature !== null ? temperature.toFixed(1) : t('aiChat.useDefault') }}
          </span>
        </div>
        <el-slider
          :model-value="temperature ?? 1"
          :min="0"
          :max="2"
          :step="0.1"
          :show-tooltip="false"
          size="small"
          @update:model-value="(value: number | number[]) => temperature = value as number"
        />
      </div>
      <div class="params-item">
        <div class="params-item-header">
          <span class="params-item-label">{{ t('aiChat.maxTokens') }}</span>
          <span
            class="params-item-value"
            :class="{ custom: maxTokens !== null }"
          >
            {{ maxTokens !== null ? maxTokens.toLocaleString() : t('aiChat.useDefault') }}
          </span>
        </div>
        <el-slider
          :model-value="maxTokens ?? 4096"
          :min="256"
          :max="32768"
          :step="256"
          :show-tooltip="false"
          size="small"
          @update:model-value="(value: number | number[]) => maxTokens = value as number"
        />
      </div>
    </div>
    <div class="params-item params-item-full">
      <div class="params-item-header">
        <span class="params-item-label">{{ t('aiChat.maxHistory') }}</span>
        <span
          class="params-item-value"
          :class="{ custom: maxHistory !== null }"
        >
          {{ maxHistory !== null ? maxHistory : '20' }}
        </span>
      </div>
      <el-slider
        :model-value="maxHistory ?? 20"
        :min="1"
        :max="50"
        :step="1"
        :show-tooltip="false"
        size="small"
        @update:model-value="(value: number | number[]) => maxHistory = value as number"
      />
    </div>
  </div>
</template>

<style scoped src="./runtime-params-panel.css"></style>
