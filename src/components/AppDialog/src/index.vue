<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { useIsMobile } from '@/hooks/useResponsive'
import {
  DEFAULT_APP_DIALOG_MOBILE_WIDTH,
  filterAppDialogAttrs,
  resolveAppDialogAlignCenter,
  resolveAppDialogBodyPadding,
  resolveAppDialogContentHeight,
  resolveAppDialogDraggable,
  resolveAppDialogWidth,
  type AppDialogSize,
} from './dialog'

defineOptions({
  name: 'AppDialog',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  width?: AppDialogSize
  mobileWidth?: AppDialogSize
  height?: AppDialogSize
  bodyPadding?: AppDialogSize
  appendToBody?: boolean
  destroyOnClose?: boolean
  draggable?: boolean
  top?: string
  showClose?: boolean
  alignCenter?: boolean
}>(), {
  mobileWidth: DEFAULT_APP_DIALOG_MOBILE_WIDTH,
  appendToBody: true,
  destroyOnClose: true,
  showClose: true,
  top: '5vh',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const attrs = useAttrs()
const isMobile = useIsMobile()

const dialogAttrs = computed(() => filterAppDialogAttrs(attrs))
const resolvedWidth = computed(() => resolveAppDialogWidth({
  isMobile: isMobile.value,
  width: props.width,
  mobileWidth: props.mobileWidth,
}))
const resolvedContentHeight = computed(() => resolveAppDialogContentHeight(props.height))
const resolvedAlignCenter = computed(() => resolveAppDialogAlignCenter({
  isMobile: isMobile.value,
  alignCenter: props.alignCenter,
}))
const resolvedDraggable = computed(() => resolveAppDialogDraggable({
  isMobile: isMobile.value,
  draggable: props.draggable,
}))
const resolvedBodyPadding = computed(() => resolveAppDialogBodyPadding({
  isMobile: isMobile.value,
  bodyPadding: props.bodyPadding,
}))
const bodyStyle = computed(() => ({
  padding: resolvedBodyPadding.value,
}))
</script>

<template>
  <el-dialog
    v-bind="dialogAttrs"
    :model-value="modelValue"
    :title="title"
    :width="resolvedWidth"
    :append-to-body="appendToBody"
    :destroy-on-close="destroyOnClose"
    :draggable="resolvedDraggable"
    :top="top"
    :show-close="showClose"
    :align-center="resolvedAlignCenter"
    class="app-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <div v-if="resolvedContentHeight" class="app-dialog__body app-dialog__body--scroll">
      <el-scrollbar :height="resolvedContentHeight" class="app-dialog__scrollbar">
        <div class="app-dialog__content app-dialog__content--scroll" :style="bodyStyle">
          <slot />
        </div>
      </el-scrollbar>
    </div>

    <div v-else class="app-dialog__body">
      <div class="app-dialog__content" :style="bodyStyle">
        <slot />
      </div>
    </div>

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </el-dialog>
</template>

<style scoped>
.app-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.app-dialog__body {
  width: 100%;
}

.app-dialog__content {
  width: 100%;
}

.app-dialog__scrollbar {
  width: 100%;
}

.app-dialog__body--scroll :deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

.app-dialog__body--scroll :deep(.el-scrollbar__view) {
  display: block;
}

@media (max-width: 768px) {
  .app-dialog :deep(.el-dialog) {
    margin: 3vh auto !important;
    left: 0 !important;
    right: 0 !important;
    transform: none !important;
  }
}
</style>
