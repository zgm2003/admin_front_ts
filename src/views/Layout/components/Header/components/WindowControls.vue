<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTauriStore } from '@/store/tauri'
import { getNativeBridge } from '@/adapters/native'
import { SemiSelect, FullScreen, CopyDocument, Close } from '@element-plus/icons-vue'

const tauriStore = useTauriStore()
const native = getNativeBridge()
const isTauri = native.kind === 'tauri'
const isMaximized = ref(false)
let unlisten: (() => void) | null = null

async function updateMaxState() {
  isMaximized.value = (await native.window.getState()).maximized
}

async function minimize() {
  await native.window.minimize()
}

async function toggleMaximize() {
  await native.window.toggleMaximize()
}

async function handleClose() {
  const saved = tauriStore.closeAction
  if (saved === 'minimize') return tauriStore.hideWindow()
  if (saved === 'exit') return tauriStore.exitApp()
  tauriStore.rememberChoice = false
  tauriStore.showCloseDialog = true
}

onMounted(async () => {
  if (!isTauri) return
  await updateMaxState()
  unlisten = await native.window.listenResize(updateMaxState)
})

onUnmounted(() => {
  unlisten?.()
})
</script>

<template>
  <div
    v-if="isTauri"
    class="window-controls"
  >
    <div class="window-controls__divider" />
    <el-button
      text
      :icon="SemiSelect"
      @click="minimize"
    />
    <el-button
      text
      :icon="isMaximized ? CopyDocument : FullScreen"
      @click="toggleMaximize"
    />
    <el-button
      text
      type="danger"
      :icon="Close"
      @click="handleClose"
    />
  </div>
</template>

<style scoped>
.window-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 4px;
  -webkit-app-region: no-drag;
}

.window-controls__divider {
  width: 1px;
  height: 16px;
  background: var(--el-border-color-lighter);
  margin-right: 4px;
}
</style>
