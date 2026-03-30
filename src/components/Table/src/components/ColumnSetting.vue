<script setup lang="ts">
import { computed } from 'vue'
import { ElCheckboxGroup, ElCheckbox, ElButton, ElPopover } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'

const props = defineProps<{ columns: any[]; modelValue: any[] }>()
const emit = defineEmits(['update:modelValue'])

const resolveColumnKey = (column: any) => String(column.key ?? column.prop ?? '')
const options = computed(() => (props.columns || []).map((c: any) => ({ label: c.label, value: resolveColumnKey(c) })))
const value = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })
</script>

<template>
  <ElPopover placement="bottom" trigger="click" :width="200">
    <template #reference>
      <ElButton :icon="Setting">列设置</ElButton>
    </template>
    <div style="max-height: 400px; overflow-y: auto;">
      <ElCheckboxGroup v-model="value">
        <div v-for="opt in options" :key="opt.value" style="margin-bottom: 8px;">
          <ElCheckbox :label="opt.value">
            <span :title="opt.label" style="display: inline-block; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle;">
              {{ opt.label }}
            </span>
          </ElCheckbox>
        </div>
      </ElCheckboxGroup>
    </div>
  </ElPopover>
</template>

<style scoped>
.el-checkbox {
  width: 100%;
  margin-right: 0;
}
</style>
