<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ADMIN_QUEUE_MONITOR_UI_URL, ensureQueueMonitorAuthCookie } from '@/api/system/queueMonitor'

const { t } = useI18n()

const frameSrc = computed(() => ADMIN_QUEUE_MONITOR_UI_URL)
const frameReady = shallowRef(false)

async function prepareFrame() {
  try {
    await ensureQueueMonitorAuthCookie()
  } finally {
    frameReady.value = true
  }
}

function openStandalone() {
  window.open(ADMIN_QUEUE_MONITOR_UI_URL, '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  void prepareFrame()
})
</script>

<template>
  <div class="box queue-monitor-page">
    <div class="queue-monitor-header">
      <div>
        <h2 class="queue-monitor-title">
          {{ t('queueMonitor.title') }}
        </h2>
        <p class="queue-monitor-desc">
          {{ t('queueMonitor.officialAsynqmonDesc') }}
        </p>
      </div>
      <el-button
        type="primary"
        @click="openStandalone"
      >
        {{ t('queueMonitor.openStandalone') }}
      </el-button>
    </div>

    <iframe
      v-if="frameReady"
      class="queue-monitor-frame"
      :src="frameSrc"
      title="Asynqmon Queue Monitor"
    />
    <div
      v-else
      class="queue-monitor-frame queue-monitor-loading"
    >
      <el-skeleton
        animated
        :rows="8"
      />
    </div>
  </div>
</template>

<style scoped>
.queue-monitor-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.queue-monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.queue-monitor-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.queue-monitor-desc {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.queue-monitor-frame {
  flex: 1;
  width: 100%;
  min-height: 0;
  height: calc(100dvh - 220px);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: #fff;
}

.queue-monitor-loading {
  box-sizing: border-box;
  padding: 24px;
}
</style>
