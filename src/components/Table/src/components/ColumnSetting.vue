<script setup lang="ts">
import { computed } from 'vue'
import { ElCheckboxGroup, ElCheckbox, ElButton, ElPopover } from 'element-plus'

const props = defineProps<{ columns: any[]; modelValue: any[] }>()
const emit = defineEmits(['update:modelValue'])

const options = computed(() => (props.columns || []).map((c: any) => ({ label: c.label, value: c.key })))
const value = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })
</script>

<template>
  <ElPopover placement="bottom" trigger="click">
    <template #reference>
      <ElButton text>列设置</ElButton>
    </template>
    <ElCheckboxGroup v-model="value">
      <ElCheckbox v-for="opt in options" :key="opt.value" :label="opt.value">{{ opt.label }}</ElCheckbox>
    </ElCheckboxGroup>
  </ElPopover>
</template>
