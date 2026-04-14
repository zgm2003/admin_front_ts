<script setup lang="ts">
import { onMounted } from 'vue'
import HomeHeroPanel from './components/HomeHeroPanel.vue'
import HomeNotificationsPanel from './components/HomeNotificationsPanel.vue'
import HomeQuickEntryPanel from './components/HomeQuickEntryPanel.vue'
import HomeWalletPanel from './components/HomeWalletPanel.vue'
import { useHomeDashboard } from './composables/useHomeDashboard'

const {
  savingQuickEntries,
  notificationsLoading,
  walletLoading,
  avatar,
  displayName,
  roleName,
  profileItems,
  profileBio,
  notifications,
  unreadCount,
  wallet,
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
  goToWallet,
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
        :profile-bio="profileBio"
        @personal="goToPersonal"
      />

      <HomeWalletPanel
        class="home-dashboard__card home-dashboard__card--wallet"
        :loading="walletLoading"
        :wallet="wallet"
        @open="goToWallet"
      />

      <HomeNotificationsPanel
        class="home-dashboard__card home-dashboard__card--notifications"
        :loading="notificationsLoading"
        :unread-count="unreadCount"
        :notifications="notifications"
        @open="goToNotifications"
        @open-item="openNotification"
      />

      <HomeQuickEntryPanel
        class="home-dashboard__card home-dashboard__card--quick-entry"
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
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
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

.home-dashboard__card--wallet {
  grid-column: 2;
  grid-row: 1;
}

.home-dashboard__card--notifications {
  grid-column: 1;
  grid-row: 2;
}

.home-dashboard__card--quick-entry {
  grid-column: 2;
  grid-row: 2;
}

@media (max-width: 1024px) {
  .home-dashboard {
    height: auto;
    overflow: visible;
  }

  .home-dashboard__grid {
    flex: none;
    grid-template-columns: 1fr;
    grid-template-rows: none;
  }

  .home-dashboard__card--hero,
  .home-dashboard__card--wallet,
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
  }
}
</style>
