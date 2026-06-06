<script setup lang="ts" generic="Row extends TableRow">
import { computed } from 'vue'
import { ElCheckboxGroup, ElCheckbox, ElButton, ElPopover } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { tableColumnKey, type TableColumn, type TableColumnKey, type TableRow } from '../types'

const props = defineProps<{
  columns: TableColumn<Row>[]
  modelValue: TableColumnKey[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TableColumnKey[]]
}>()

const { t } = useI18n()

const options = computed(() => props.columns.map((column) => ({
  label: column.label,
  value: tableColumnKey<Row>(column),
})))

const value = computed({
  get: () => props.modelValue,
  set: (nextValue: TableColumnKey[]) => emit('update:modelValue', nextValue),
})
</script>

<template>
  <ElPopover placement="bottom" trigger="click" :width="200">
    <template #reference>
      <ElButton :icon="Setting">{{ t('common.actions.columnSetting') }}</ElButton>
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
