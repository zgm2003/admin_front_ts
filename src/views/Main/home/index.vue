<script setup lang="ts">
import { onMounted } from 'vue'
import HomeNotificationsPanel from './components/HomeNotificationsPanel.vue'
import { useHomeDashboard } from './composables/useHomeDashboard'

const {
  notificationsLoading,
  notifications,
  unreadCount,
  loadHomeData,
  goToNotifications,
  openNotification,
} = useHomeDashboard()

onMounted(() => {
  void loadHomeData()
})
</script>

<template>
  <div class="home-dashboard">
    <div class="home-dashboard__grid">
      <HomeNotificationsPanel
        class="home-dashboard__card home-dashboard__card--notifications"
        :loading="notificationsLoading"
        :unread-count="unreadCount"
        :notifications="notifications"
        @open="goToNotifications"
        @open-item="openNotification"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.home-dashboard {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.home-dashboard__grid {
  display: grid;
  flex: 1 1 auto;
  min-height: 0;
  gap: 14px;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  align-items: stretch;
}

.home-dashboard__card {
  min-height: 0;
  height: 100%;
}

.home-dashboard__card--notifications {
  grid-column: 1;
  grid-row: 1;
}

@media (max-width: 1024px) {
  .home-dashboard {
    height: auto;
    overflow: visible;
  }

  .home-dashboard__grid {
    flex: none;
    grid-template-rows: none;
  }

  .home-dashboard__card--notifications {
    grid-column: auto;
    grid-row: auto;
  }

  .home-dashboard__card {
    height: auto;
  }
}

@media (max-width: 768px) {
  .home-dashboard {
    gap: 14px;
  }
}
</style>
