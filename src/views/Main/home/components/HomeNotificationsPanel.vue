<script setup lang="ts">
import { computed } from 'vue'
import type { NotificationItem } from '@/api/system/notification'
import { CommonEnum } from '@/enums'

defineProps<{
  loading: boolean
  unreadCount: number
  notifications: NotificationItem[]
}>()

defineEmits<{
  open: []
  openItem: [item: NotificationItem]
}>()

const typeTagType = (type: number) => {
  switch (type) {
    case 2:
      return 'success'
    case 3:
      return 'warning'
    case 4:
      return 'danger'
    default:
      return 'info'
  }
}

const relativeFormatter = computed(() => new Intl.RelativeTimeFormat(navigator.language || 'zh-CN', { numeric: 'auto' }))

function isUnread(item: NotificationItem) {
  return item.is_read === CommonEnum.NO
}

function formatRelativeTime(value: string) {
  const target = new Date(value).getTime()
  if (Number.isNaN(target)) {
    return value
  }

  const diffMinutes = Math.round((target - Date.now()) / 60000)
  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatter.value.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.value.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffHours / 24)
  return relativeFormatter.value.format(diffDays, 'day')
}
</script>

<template>
  <section class="dashboard-card notifications-card" v-loading="loading">
    <div class="card-head">
      <div class="card-title-group">
        <div class="card-title-row">
          <div class="card-title">{{ $t('home.notificationsTitle') }}</div>
          <div class="card-count-badge">{{ unreadCount }}</div>
        </div>
        <div class="card-subtitle">{{ $t('home.notificationsSubtitle') }}</div>
      </div>
      <el-button text type="primary" @click="$emit('open')">{{ $t('notification.page.viewAll') }}</el-button>
    </div>

    <div v-if="notifications.length" class="notification-list">
      <button
        v-for="item in notifications"
        :key="item.id"
        type="button"
        :class="['notification-item', { 'notification-item--unread': isUnread(item) }]"
        @click="$emit('openItem', item)"
      >
        <div class="notification-main">
          <div class="notification-top">
            <span class="notification-title">{{ item.title }}</span>
            <el-tag :type="typeTagType(item.type)" size="small">{{ item.type_text }}</el-tag>
          </div>
          <p class="notification-content">{{ item.content }}</p>
        </div>

        <div class="notification-meta">
          <span>{{ formatRelativeTime(item.created_at) }}</span>
          <span v-if="item.level_text" class="notification-level">{{ item.level_text }}</span>
        </div>
      </button>
    </div>

    <el-empty v-else :description="$t('home.notificationsEmpty')" :image-size="72" />
  </section>
</template>

<style scoped lang="scss">
.dashboard-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  border: 1px solid var(--el-border-color-light);
  border-radius: 18px;
  background: var(--el-bg-color);
  padding: 18px 18px 16px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.card-title-group {
  min-width: 0;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.card-count-badge {
  flex-shrink: 0;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 700;
  line-height: 24px;
  text-align: center;
}

.card-subtitle {
  margin-top: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.notification-list::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.notification-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-fill-color-extra-light);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background-color 180ms ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }
}

.notification-item--unread {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.notification-main {
  min-width: 0;
  flex: 1;
}

.notification-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification-title {
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.notification-content {
  margin: 4px 0 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-meta {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.notification-level {
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
}

@media (max-width: 768px) {
  .dashboard-card {
    padding: 14px;
  }

  .card-head {
    flex-direction: column;
    gap: 10px;
  }

  .card-subtitle {
    margin-bottom: 10px;
  }

  .notification-item {
    flex-direction: column;
    padding: 12px;
  }

  .notification-meta {
    align-items: flex-start;
    flex-direction: row;
  }
}
</style>
