<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Bell, Check, Delete } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import { NotificationApi, type NotificationItem } from '@/api/system/notification'
import { useIsMobile } from '@/hooks/useResponsive'
import { useLogStream } from '@/components/LogStream/src/useLogStream'
import { onWsMessage } from '@/hooks/useWebSocket'
import { formatTimeAgo } from '@/utils/date'

const UNREAD = 2
const { t } = useI18n()
const router = useRouter()
const isMobile = useIsMobile()
const visible = ref(false)
const unreadCount = ref(0)
const { list, loading, hasMore, loadInitial, loadMore, prepend } = useLogStream<NotificationItem>({ api: NotificationApi, pageSize: 20 })

// 跳转链接
const navigateTo = (link?: string) => {
  if (!link) return
  link.startsWith('http') ? window.open(link, '_blank') : router.push(link)
}

// 标记已读
const markRead = async (item: NotificationItem) => {
  if (item.is_read !== UNREAD) return
  try {
    await NotificationApi.read(item.id)
    item.is_read = 1
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch {}
}

const markAllRead = async () => {
  try {
    await NotificationApi.read()
    list.value.forEach(item => item.is_read = 1)
    unreadCount.value = 0
  } catch {}
}

const handleClick = (item: NotificationItem) => {
  markRead(item)
  if (item.link) { visible.value = false; navigateTo(item.link) }
}

const handleDelete = async (item: NotificationItem, index: number) => {
  try {
    await NotificationApi.del(item.id)
    list.value.splice(index, 1)
    if (item.is_read === UNREAD) unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch {}
}

// WebSocket 监听
let unsubscribe: (() => void) | null = null

onMounted(async () => {
  const res: any = await NotificationApi.unreadCount().catch(() => null)
  unreadCount.value = res?.count || 0
  
  unsubscribe = onWsMessage('notification', ({ data = {} }) => {
    unreadCount.value++
    prepend({ id: data.id, title: data.title || '', content: data.content || '', type: data.notification_type || 'info', level: data.level || 'normal', link: data.link || '', is_read: UNREAD, created_at: data.created_at || new Date().toISOString() })
    if (data.level === 'urgent') {
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
    @show="loadInitial"
  >
    <template #reference>
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" class="notification-badge">
        <button class="trigger-btn">
          <el-icon :size="18"><Bell /></el-icon>
        </button>
      </el-badge>
    </template>

    <div class="notification-panel">
      <!-- 头部 -->
      <div class="panel-header">
        <span class="title">{{ t('notification.title') }}</span>
        <el-button v-if="unreadCount > 0" type="primary" link size="small" @click="markAllRead">
          <el-icon><Check /></el-icon>
          {{ t('notification.markAllRead') }}
        </el-button>
      </div>

      <!-- 列表 -->
      <div class="panel-body" v-loading="loading && list.length === 0">
        <template v-if="list.length > 0">
          <div v-for="(item, index) in list" :key="item.id" :class="['notification-item', { unread: item.is_read === UNREAD }]" @click="handleClick(item)">
            <div class="item-content">
              <div class="item-title"><span class="dot" v-if="item.is_read === UNREAD" />{{ item.title }}</div>
              <div class="item-desc" v-if="item.content">{{ item.content }}</div>
              <div class="item-time">{{ formatTimeAgo(item.created_at) }}</div>
            </div>
            <el-button type="danger" link size="small" class="delete-btn" @click.stop="handleDelete(item, index)"><el-icon><Delete /></el-icon></el-button>
          </div>
          <div class="load-more" v-if="hasMore"><el-button type="primary" link :loading="loading" @click="loadMore">{{ t('notification.loadMore') }}</el-button></div>
        </template>
        <el-empty v-else-if="!loading" :description="t('notification.empty')" :image-size="80" />
      </div>
    </div>
  </el-popover>
</template>

<style scoped>
.notification-badge { display: flex; }
.trigger-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; background: transparent; border-radius: 8px; color: var(--el-text-color-regular); cursor: pointer; transition: all 0.15s; &:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); } }
.notification-panel { margin: -12px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--el-border-color-lighter); .title { font-weight: 600; font-size: 14px; } }
.panel-body { max-height: 400px; overflow-y: auto; }
.notification-item { display: flex; align-items: flex-start; padding: 12px 16px; cursor: pointer; transition: background-color 0.2s; &:hover { background: var(--el-fill-color-light); .delete-btn { opacity: 1; } } &.unread { background: var(--el-color-primary-light-9); &:hover { background: var(--el-color-primary-light-8); } } }
.item-content { flex: 1; min-width: 0; }
.item-title { display: flex; align-items: center; font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); margin-bottom: 4px; .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--el-color-primary); margin-right: 8px; flex-shrink: 0; } }
.item-desc { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-time { font-size: 12px; color: var(--el-text-color-placeholder); }
.delete-btn { opacity: 0; transition: opacity 0.2s; }
.load-more { text-align: center; padding: 12px; }
@media (max-width: 768px) { .trigger-btn { width: 32px; height: 32px; } .panel-body { max-height: 60vh; } .delete-btn { opacity: 1; } }
</style>
