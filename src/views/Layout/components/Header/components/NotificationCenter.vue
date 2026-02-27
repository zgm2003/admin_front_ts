<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { DIcon } from '@/components/DIcon'
import { NotificationApi, type NotificationItem } from '@/api/system/notification'
import { CommonEnum } from '@/enums'
import { useIsMobile } from '@/hooks/useResponsive'
import { onWsMessage } from '@/hooks/useWebSocket'
import { shouldUseNative } from '@/store/tauri'
import { formatTimeAgo } from '@/utils/date'

const PAGE_SIZE = 5
const { t } = useI18n()
const router = useRouter()
const isMobile = useIsMobile()
const visible = ref(false)
const loading = ref(false)
const unreadCount = ref(0)
const list = ref<NotificationItem[]>([])

const isUnread = (item: NotificationItem) => item.is_read === CommonEnum.NO

// 每次打开 Popover 拉最新 5 条
const loadList = async () => {
  loading.value = true
  try {
    const res = await NotificationApi.list({ page_size: PAGE_SIZE, current_page: 1 })
    list.value = (res as { list: NotificationItem[] })?.list || []
  } catch {} finally {
    loading.value = false
  }
}

const navigateTo = (link?: string) => {
  if (!link) return
  link.startsWith('http') ? window.open(link, '_blank') : router.push(link)
}

const markRead = async (item: NotificationItem) => {
  if (!isUnread(item)) return
  try {
    await NotificationApi.read({ id: item.id })
    item.is_read = CommonEnum.YES
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch {}
}

const markAllRead = async () => {
  try {
    await NotificationApi.read()
    list.value.forEach(item => item.is_read = CommonEnum.YES)
    unreadCount.value = 0
  } catch {}
}

const handleClick = (item: NotificationItem) => {
  markRead(item)
  if (item.link) { visible.value = false; navigateTo(item.link) }
}

const goNotificationPage = () => {
  visible.value = false
  router.push('/notification')
}

// WebSocket 监听：只更新 badge，不插 DOM
let unsubscribe: (() => void) | null = null

onMounted(async () => {
  const res = await NotificationApi.unreadCount().catch(() => null) as { count: number } | null
  unreadCount.value = res?.count || 0

  unsubscribe = onWsMessage('notification', async ({ data = {} }) => {
    unreadCount.value++
    if (data.level === 'urgent') {
      if (await shouldUseNative()) {
        const { invoke } = await import('@tauri-apps/api/core')
        invoke('send_notification', { title: data.title || t('notification.title'), body: data.content || '' })
      }
      const n = ElNotification({ title: data.title || t('notification.title'), message: data.content, type: data.notification_type || 'info', duration: 5000, onClick: () => { n.close(); navigateTo(data.link) } })
    }
  })
})

onUnmounted(() => unsubscribe?.())
</script>

<template>
  <el-popover
    v-model:visible="visible"
    :width="isMobile ? '90vw' : 360"
    trigger="click"
    placement="bottom-end"
    :show-arrow="false"
    popper-class="notification-popover"
    :hide-after="0"
    @show="loadList"
  >
    <template #reference>
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" class="notification-badge">
        <el-button text class="trigger-btn">
          <DIcon icon="Bell" :size="18" />
        </el-button>
      </el-badge>
    </template>

    <div class="notification-panel">
      <div class="panel-header">
        <div class="header-left">
          <span class="title">{{ t('notification.title') }}</span>
          <span v-if="unreadCount > 0" class="unread-dot-label">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </div>
        <el-button v-if="unreadCount > 0" type="primary" link size="small" @click="markAllRead">
          <DIcon icon="Check" :size="14" />
          {{ t('notification.markAllRead') }}
        </el-button>
      </div>

      <div class="panel-body" v-loading="loading">
        <template v-if="list.length > 0">
          <div
            v-for="item in list"
            :key="item.id"
            :class="['notification-item', { unread: isUnread(item) }]"
            @click="handleClick(item)"
          >
            <div class="item-content">
              <div class="item-title-row">
                <div class="item-title">
                  <span class="unread-dot" v-if="isUnread(item)" />
                  {{ item.title }}
                </div>
                <div class="item-time">{{ formatTimeAgo(item.created_at) }}</div>
              </div>
            </div>
          </div>
        </template>
        <el-empty v-else-if="!loading" :description="t('notification.empty')" :image-size="80" />
      </div>

      <div class="panel-footer">
        <el-button type="primary" link @click="goNotificationPage">
          {{ t('notification.page.viewAll') }}
          <DIcon icon="ArrowRight" :size="14" />
        </el-button>
      </div>
    </div>
  </el-popover>
</template>

<style scoped lang="scss">
.notification-badge {
  display: flex;
  :deep(.el-badge__content) { top: 6px; right: 6px; border: none; box-shadow: 0 0 0 2px var(--el-bg-color); }
}
.trigger-btn { padding: 8px; }
.notification-panel { margin: -12px; border-radius: 12px; overflow: hidden; }

.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 18px; border-bottom: 1px solid var(--el-border-color-lighter);
  .header-left { display: flex; align-items: center; gap: 8px; }
  .title { font-weight: 700; font-size: 15px; }
  .unread-dot-label { padding: 0 6px; height: 18px; line-height: 18px; background: var(--el-color-primary-light-9); color: var(--el-color-primary); border-radius: 10px; font-size: 11px; font-weight: 700; }
}

.panel-body { max-height: 420px; overflow-y: auto; padding: 8px 0; }

.notification-item {
  padding: 12px 18px; cursor: pointer; border-bottom: 1px solid var(--el-border-color-extra-light); transition: background 0.2s;
  &:hover { background: var(--el-fill-color-light); }
  &.unread { background: var(--el-color-primary-light-9); }
  &:last-child { border-bottom: none; }
}

.item-content { flex: 1; min-width: 0; }
.item-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.item-title { display: flex; align-items: center; font-size: 14px; font-weight: 600; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.unread-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--el-color-primary); margin-right: 8px; }
.item-time { font-size: 12px; color: var(--el-text-color-placeholder); }
.panel-footer { display: flex; justify-content: center; padding: 12px; border-top: 1px solid var(--el-border-color-lighter); }

@media (max-width: 768px) { .panel-body { max-height: 60vh; } }
</style>
