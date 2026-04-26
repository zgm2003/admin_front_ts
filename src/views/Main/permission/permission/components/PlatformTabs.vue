<script setup lang="ts">
import type { DictOption } from '@/types/common'

const model = defineModel<string>({ required: true })

const props = defineProps<{
  options: DictOption<string>[]
}>()

const emit = defineEmits<{
  change: [value: string]
}>()

function handleChange(value: string | number) {
  emit('change', String(value))
}
</script>

<template>
  <el-tabs
    v-model="model"
    class="permission-platform-tabs"
    @tab-change="handleChange"
  >
    <el-tab-pane
      v-for="item in props.options"
      :key="item.value"
      :label="item.label"
      :name="item.value"
    />
  </el-tabs>
</template>

<style scoped>
.permission-platform-tabs {
  margin-bottom: 10px;
}
</style>
