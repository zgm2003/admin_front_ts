<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshRight } from '@element-plus/icons-vue'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

const { t, locale } = useI18n()
const { isOffline, lastOfflineAt, refreshPage } = useNetworkStatus()

const offlineTime = computed(() => {
  if (!lastOfflineAt.value) {
    return ''
  }

  return new Intl.DateTimeFormat(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(lastOfflineAt.value)
})
</script>

<template>
  <transition name="network-notice">
    <aside
      v-if="isOffline"
      class="network-notice"
      role="status"
      aria-live="assertive"
    >
      <el-alert
        type="warning"
        effect="dark"
        show-icon
        :closable="false"
        class="network-notice__alert"
      >
        <template #title>
          <span class="network-notice__title">{{ t('network.offline.title') }}</span>
        </template>

        <div class="network-notice__body">
          <p class="network-notice__message">
            {{ t('network.offline.message') }}
            <span
              v-if="offlineTime"
              class="network-notice__time"
            >
              {{ t('network.offline.since', { time: offlineTime }) }}
            </span>
          </p>

          <el-button
            class="network-notice__refresh"
            size="small"
            type="warning"
            plain
            @click="refreshPage"
          >
            <el-icon>
              <RefreshRight />
            </el-icon>
            <span>{{ t('network.offline.refresh') }}</span>
          </el-button>
        </div>
      </el-alert>
    </aside>
  </transition>
</template>

<style scoped lang="scss">
.network-notice {
  position: fixed;
  top: 18px;
  right: 22px;
  z-index: 4000;
  width: min(430px, calc(100vw - 32px));
  pointer-events: none;
}

.network-notice__alert {
  pointer-events: auto;
  border: 1px solid rgba(255, 173, 77, 0.46);
  border-radius: 16px;
  box-shadow:
    0 18px 48px rgba(63, 32, 6, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
  background:
    linear-gradient(135deg, rgba(52, 35, 10, 0.96), rgba(124, 55, 9, 0.94)) !important;
}

.network-notice__title {
  font-weight: 800;
  letter-spacing: 0.03em;
}

.network-notice__body {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 4px;
}

.network-notice__message {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: rgba(255, 251, 235, 0.9);
  font-size: 13px;
  line-height: 1.55;
}

.network-notice__time {
  display: block;
  margin-top: 2px;
  color: rgba(255, 229, 184, 0.78);
  font-size: 12px;
}

.network-notice__refresh {
  flex-shrink: 0;
  border-color: rgba(255, 225, 177, 0.55);
  color: #3c2104;
  font-weight: 700;
}

.network-notice-enter-active,
.network-notice-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.network-notice-enter-from,
.network-notice-leave-to {
  opacity: 0;
  transform: translate3d(18px, -10px, 0) scale(0.98);
}

@media (max-width: 768px) {
  .network-notice {
    top: 12px;
    right: 12px;
    left: 12px;
    width: auto;
  }

  .network-notice__body {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
