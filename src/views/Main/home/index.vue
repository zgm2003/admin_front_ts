<script setup lang="ts">
import { onMounted } from 'vue'
import HomeHeroPanel from './components/HomeHeroPanel.vue'
import HomeNotificationsPanel from './components/HomeNotificationsPanel.vue'
import HomeQuickEntryPanel from './components/HomeQuickEntryPanel.vue'
import { useHomeDashboard } from './composables/useHomeDashboard'

const {
  savingQuickEntries,
  notificationsLoading,
  avatar,
  displayName,
  roleName,
  profileItems,
  notifications,
  unreadCount,
  localizedQuickEntryCards,
  quickEntryManagerVisible,
  quickEntryDraft,
  quickEntryLimitReached,
  quickEntryLimit,
  selectedPermissionId,
  availableQuickEntryOptions,
  loadHomeData,
  goTo,
  goToPersonal,
  goToNotifications,
  openNotification,
  openQuickEntryManager,
  addQuickEntryDraft,
  removeQuickEntryDraft,
  moveQuickEntry,
  saveQuickEntryDraft,
} = useHomeDashboard()

onMounted(() => {
  void loadHomeData()
})
</script>

<template>
  <div class="home-dashboard">
    <div class="home-dashboard__grid">
      <HomeHeroPanel
        class="home-dashboard__card home-dashboard__card--hero"
        :display-name="displayName"
        :role-name="roleName"
        :avatar="avatar"
        :profile-items="profileItems"
        @personal="goToPersonal"
      />

      <HomeNotificationsPanel
        class="home-dashboard__card home-dashboard__card--notifications"
        :loading="notificationsLoading"
        :unread-count="unreadCount"
        :notifications="notifications"
        @open="goToNotifications"
        @open-item="openNotification"
      />

      <div class="home-dashboard__card home-dashboard__card--quick-entry">
        <HomeQuickEntryPanel
          :entries="localizedQuickEntryCards"
          :model-value="quickEntryManagerVisible"
          :draft="quickEntryDraft"
          :options="availableQuickEntryOptions"
          :limit="quickEntryLimit"
          :limit-reached="quickEntryLimitReached"
          :selected-permission-id="selectedPermissionId"
          :saving="savingQuickEntries"
          @navigate="goTo"
          @manage="openQuickEntryManager"
          @update:model-value="quickEntryManagerVisible = $event"
          @update:selected-permission-id="selectedPermissionId = $event"
          @add="addQuickEntryDraft"
          @remove="removeQuickEntryDraft"
          @move="moveQuickEntry"
          @save="saveQuickEntryDraft"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.home-dashboard {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 8px;
  overflow: hidden;
  isolation: isolate;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, var(--shell-line));
  border-radius: 26px;
  background:
    radial-gradient(circle at 16% 0%, color-mix(in srgb, var(--el-color-primary) 18%, transparent) 0, transparent 28%),
    radial-gradient(circle at 86% 12%, rgba(14, 165, 233, 0.14) 0, transparent 30%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(246, 250, 255, 0.86) 52%, rgba(241, 247, 255, 0.94) 100%);
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.06);
}

.home-dashboard::before,
.home-dashboard::after {
  content: '';
  position: absolute;
  pointer-events: none;
  border-radius: 999px;
  z-index: 0;
}

.home-dashboard::before {
  right: -92px;
  top: -118px;
  width: 320px;
  height: 320px;
  background:
    radial-gradient(circle, rgba(59, 130, 246, 0.24) 0%, rgba(59, 130, 246, 0.08) 44%, transparent 72%);
  filter: blur(8px);
}

.home-dashboard::after {
  left: -84px;
  bottom: 14%;
  width: 240px;
  height: 240px;
  background:
    radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, rgba(16, 185, 129, 0.05) 46%, transparent 72%);
  filter: blur(10px);
}

.home-dashboard__grid {
  position: relative;
  z-index: 1;
  display: grid;
  flex: 1 1 auto;
  min-height: 0;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: minmax(0, 1fr);
  align-items: stretch;
}

.home-dashboard__card {
  min-height: 0;
  height: 100%;
}

.home-dashboard__card--hero {
  grid-column: 1;
  grid-row: 1;
}

.home-dashboard__card--notifications {
  grid-column: 2;
  grid-row: 1;
}

.home-dashboard__card--quick-entry {
  grid-column: 1 / span 2;
  grid-row: 2;
}

@media (max-width: 1024px) {
  .home-dashboard {
    height: auto;
    overflow: visible;
    padding: 8px;
  }

  .home-dashboard__grid {
    flex: none;
    grid-template-columns: 1fr;
    grid-template-rows: none;
  }

  .home-dashboard__card--hero,
  .home-dashboard__card--notifications,
  .home-dashboard__card--quick-entry {
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
    padding: 6px;
    border-radius: 20px;
  }
}
</style>
