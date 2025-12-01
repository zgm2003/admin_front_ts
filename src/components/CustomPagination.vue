<template>
  <el-pagination
    v-model:current-page="currentPage"
    v-model:page-size="pageSize"
    :page-sizes="[10, 20, 30, 40, 50]"
    :layout="'total, slot, sizes, prev, pager, next, jumper'"
    :total="total"
    @size-change="onSizeChange"
    @current-change="onCurrentChange"
  >
    <!-- default 插槽（在 layout 中用 slot 指定） -->
    <template #default>
      <el-input
        v-model.number="customInput"
        type="number"
        placeholder="不超过500"
        style="width: 100px; margin: 0 12px;"
        @change="onCustomSizeChange"
      />
    </template>
  </el-pagination>
</template>

<script setup>
import {ref, watch} from 'vue'

const props = defineProps({
  total: {type: Number, required: true},
  currentPage: {type: Number, required: true},
  pageSize: {type: Number, required: true},
})
const emit = defineEmits([
  'update:currentPage',
  'update:pageSize',
  'size-change',
  'current-change',
])

const pageSize = ref(props.pageSize)
const currentPage = ref(props.currentPage)
const customInput = ref(props.pageSize)

watch(() => props.pageSize, val => {
  pageSize.value = val
  customInput.value = val
})
watch(() => props.currentPage, val => {
  currentPage.value = val
})

function onSizeChange(val) {
  pageSize.value = val
  customInput.value = val
  emit('update:pageSize', val)
  emit('size-change', val)
}

function onCurrentChange(val) {
  emit('update:currentPage', val)
  emit('current-change', val)
}

function onCustomSizeChange() {
  let val = parseInt(customInput.value, 10)
  if (isNaN(val) || val <= 0) return
  if (val > 500) val = 500
  customInput.value = val
  pageSize.value = val
  emit('update:pageSize', val)
  emit('size-change', val)
}
</script>
