<script setup lang="ts">
import { computed, ref } from 'vue'

const visibleLimit = 3

const props = defineProps<{
  items: readonly string[]
  type: 'success' | 'warning'
}>()

const popoverVisible = ref(false)
const visibleItems = computed(() => props.items.slice(0, visibleLimit))
const overflowItems = computed(() => props.items.slice(visibleLimit))

function showPopover() {
  if (overflowItems.value.length > 0) popoverVisible.value = true
}

function hidePopover() {
  popoverVisible.value = false
}
</script>

<template>
  <el-space
    data-test="extension-tag-list"
    :size="4"
    @mouseenter="showPopover"
    @mouseleave="hidePopover"
  >
    <el-tag
      v-for="item in visibleItems"
      :key="item"
      data-test="visible-extension"
      size="small"
      :type="type"
    >
      {{ item }}
    </el-tag>
    <el-popover
      v-if="overflowItems.length > 0"
      :visible="popoverVisible"
      :persistent="false"
      :teleported="false"
      placement="top"
      :width="320"
    >
      <template #reference>
        <el-tag
          data-test="extension-overflow"
          size="small"
          type="info"
          tabindex="0"
          @focus="showPopover"
          @blur="hidePopover"
          @keydown.esc="hidePopover"
        >
          +{{ overflowItems.length }}
        </el-tag>
      </template>
      <el-scrollbar max-height="240px">
        <el-space
          wrap
          :size="4"
        >
          <el-tag
            v-for="item in overflowItems"
            :key="item"
            data-test="overflow-extension"
            size="small"
            :type="type"
          >
            {{ item }}
          </el-tag>
        </el-space>
      </el-scrollbar>
    </el-popover>
  </el-space>
</template>
