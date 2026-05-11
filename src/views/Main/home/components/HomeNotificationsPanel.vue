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
  <section
    v-loading="loading"
    class="dashboard-card notifications-card"
  >
    <div class="card-head">
      <div class="card-title-group">
        <div class="card-title-row">
          <div class="card-title">
            {{ $t('home.notificationsTitle') }}
          </div>
          <div class="card-count-badge">
            {{ unreadCount }}
          </div>
        </div>
        <div class="card-subtitle">
          {{ $t('home.notificationsSubtitle') }}
        </div>
      </div>
      <el-button
        text
        type="primary"
        @click="$emit('open')"
      >
        {{ $t('notification.page.viewAll') }}
      </el-button>
    </div>

    <div
      v-if="notifications.length"
      class="notification-list"
    >
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
            <el-tag
              :type="typeTagType(item.type)"
              size="small"
            >
              {{ item.type_text }}
            </el-tag>
          </div>
          <p class="notification-content">
            {{ item.content }}
          </p>
        </div>

        <div class="notification-meta">
          <span>{{ formatRelativeTime(item.created_at) }}</span>
          <span
            v-if="item.level_text"
            class="notification-level"
          >{{ item.level_text }}</span>
        </div>
      </button>
    </div>

    <el-empty
      v-else
      :description="$t('home.notificationsEmpty')"
      :image-size="72"
    />
  </section>
</template>

<style scoped lang="scss">
.dashboard-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(248, 251, 255, 0.96) 100%);
  box-shadow:
    0 22px 48px rgba(15, 23, 42, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  padding: 20px;
}

.dashboard-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: linear-gradient(90deg, var(--el-color-primary), rgba(14, 165, 233, 0.4), transparent);
}

.card-head {
  position: relative;
  z-index: 1;
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
  font-size: 19px;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--shell-text-strong);
}

.card-count-badge {
  flex-shrink: 0;
  min-width: 28px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary) 12%, white);
  color: color-mix(in srgb, var(--el-color-primary) 84%, #0f172a);
  font-size: 13px;
  font-weight: 900;
  line-height: 26px;
  text-align: center;
  box-shadow: 0 8px 18px color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}

.card-subtitle {
  margin-top: 6px;
  margin-bottom: 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--shell-text-soft);
}

.notification-list {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
  padding-right: 2px;
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
  position: relative;
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  overflow: hidden;
  padding: 13px 14px 13px 16px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.035);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;

  &::before {
    content: '';
    position: absolute;
    inset: 12px auto 12px 0;
    width: 3px;
    border-radius: 999px;
    background: transparent;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--el-color-primary) 26%, rgba(148, 163, 184, 0.2));
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.06);
  }
}

.notification-item--unread {
  border-color: color-mix(in srgb, var(--el-color-primary) 32%, rgba(148, 163, 184, 0.16));
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--el-color-primary) 9%, white), rgba(255, 255, 255, 0.86));

  &::before {
    background: linear-gradient(180deg, var(--el-color-primary), rgba(14, 165, 233, 0.34));
  }
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
  font-weight: 800;
  color: var(--shell-text-strong);
}

.notification-content {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--shell-text-soft);
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
  gap: 8px;
  font-size: 11px;
  color: var(--shell-text-soft);
}

.notification-level {
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.04);
  font-weight: 700;
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
