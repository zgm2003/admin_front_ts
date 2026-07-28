<script setup lang="ts">
import { computed, nextTick, useAttrs, useId, watch } from 'vue'
import { useIsMobile } from '@/hooks/useResponsive'
import {
  DEFAULT_APP_DIALOG_MOBILE_WIDTH,
  filterAppDialogAttrs,
  resolveAppDialogAlignCenter,
  resolveAppDialogBodyPadding,
  resolveAppDialogContentHeight,
  resolveAppDialogDraggable,
  resolveAppDialogPadding,
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
  ariaLabel?: string
  description?: string
  width?: AppDialogSize
  mobileWidth?: AppDialogSize
  height?: AppDialogSize
  bodyPadding?: AppDialogSize
  showHeader?: boolean
  headerPadding?: AppDialogSize
  footerPadding?: AppDialogSize
  appendToBody?: boolean
  destroyOnClose?: boolean
  draggable?: boolean
  top?: string
  showClose?: boolean
  alignCenter?: boolean
  closeOnPressEscape?: boolean
}>(), {
  title: '',
  ariaLabel: '',
  description: '',
  width: undefined,
  mobileWidth: DEFAULT_APP_DIALOG_MOBILE_WIDTH,
  height: undefined,
  bodyPadding: undefined,
  showHeader: true,
  headerPadding: undefined,
  footerPadding: undefined,
  appendToBody: true,
  destroyOnClose: true,
  draggable: undefined,
  showClose: true,
  closeOnPressEscape: true,
  top: '5vh',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const attrs = useAttrs()
const isMobile = useIsMobile()
const descriptionId = `app-dialog-description-${useId()}`
let returnFocusTarget: HTMLElement | null = null

watch(() => props.modelValue, (visible, wasVisible) => {
  if (visible && !wasVisible && document.activeElement instanceof HTMLElement) {
    returnFocusTarget = document.activeElement
  }
})

function restoreTriggerFocus() {
  const target = returnFocusTarget
  returnFocusTarget = null
  if (!target) return
  void nextTick(() => target.focus())
}

const dialogAttrs = computed(() => {
  const filteredAttrs = filterAppDialogAttrs(attrs)
  delete filteredAttrs.class
  delete filteredAttrs.style
  return filteredAttrs
})
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
const dialogStyle = computed(() => {
  const headerPadding = resolveAppDialogPadding(props.headerPadding)
  const footerPadding = resolveAppDialogPadding(props.footerPadding)

  return {
    ...(headerPadding ? { '--app-dialog-header-padding': headerPadding } : {}),
    ...(footerPadding ? { '--app-dialog-footer-padding': footerPadding } : {}),
  }
})
const dialogClasses = computed(() => [
  'app-dialog',
  attrs.class,
  {
    'app-dialog--header-hidden': !props.showHeader,
    'app-dialog--custom-header-padding': props.headerPadding !== undefined,
    'app-dialog--custom-footer-padding': props.footerPadding !== undefined,
  },
])
const resolvedDialogTitle = computed(() => (
  props.showHeader ? props.title : props.ariaLabel || props.title
))
</script>

<template>
  <el-dialog
    v-bind="dialogAttrs"
    :model-value="modelValue"
    :title="resolvedDialogTitle"
    :width="resolvedWidth"
    :append-to-body="appendToBody"
    :destroy-on-close="destroyOnClose"
    :draggable="resolvedDraggable"
    :top="top"
    :show-close="showClose"
    :align-center="resolvedAlignCenter"
    :close-on-press-escape="closeOnPressEscape"
    :class="dialogClasses"
    :style="[attrs.style, dialogStyle]"
    @update:model-value="emit('update:modelValue', $event)"
    @closed="restoreTriggerFocus"
  >
    <p
      v-if="description"
      :id="descriptionId"
      class="sr-only"
    >
      {{ description }}
    </p>
    <template
      v-if="showHeader && ($slots.header || (!title && ariaLabel))"
      #header="{ titleId, titleClass }"
    >
      <div
        v-if="$slots.header"
        :id="titleId"
        class="app-dialog__header-content"
      >
        <slot name="header" />
      </div>
      <span
        v-else
        :id="titleId"
        :class="[titleClass, 'sr-only']"
      >{{ ariaLabel }}</span>
    </template>

    <div
      v-if="resolvedContentHeight"
      class="app-dialog__body app-dialog__body--scroll"
    >
      <el-scrollbar
        :height="resolvedContentHeight"
        class="app-dialog__scrollbar"
      >
        <div
          class="app-dialog__content app-dialog__content--scroll"
          :style="bodyStyle"
        >
          <slot />
        </div>
      </el-scrollbar>
    </div>

    <div
      v-else
      class="app-dialog__body"
    >
      <div
        class="app-dialog__content"
        :style="bodyStyle"
      >
        <slot />
      </div>
    </div>

    <template
      v-if="$slots.footer"
      #footer
    >
      <slot name="footer" />
    </template>
  </el-dialog>
</template>

<style scoped>
.app-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.app-dialog--header-hidden :deep(.el-dialog__header) {
  display: none;
}

.app-dialog--custom-header-padding :deep(.el-dialog__header) {
  padding: var(--app-dialog-header-padding);
}

.app-dialog--custom-footer-padding :deep(.el-dialog__footer) {
  padding: var(--app-dialog-footer-padding);
}

.app-dialog__body {
  width: 100%;
}

.app-dialog__content {
  width: 100%;
}

.app-dialog__header-content {
  width: 100%;
  min-width: 0;
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
