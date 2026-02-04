<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Bell, Check, Delete, ArrowRight, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import { NotificationApi, type NotificationItem } from '@/api/system/notification'
import { useIsMobile } from '@/hooks/useResponsive'
import { useLogStream } from '@/components/LogStream/src/useLogStream'
import { onWsMessage } from '@/hooks/useWebSocket'
import { shouldUseNative } from '@/store/tauri'
import { formatTimeAgo } from '@/utils/date'

const UNREAD = 2
const { t } = useI18n()
const router = useRouter()
const isMobile = useIsMobile()
const visible = ref(false)
const unreadCount = ref(0)
const { list, loading, hasMore, loadInitial, loadMore, prepend } = useLogStream<NotificationItem>({ api: NotificationApi, pageSize: 20 })

const expandedItems = ref<Set<string | number>>(new Set())
const toggleExpand = (id: string | number) => {
  if (expandedItems.value.has(id)) expandedItems.value.delete(id)
  else expandedItems.value.add(id)
}

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
  
  unsubscribe = onWsMessage('notification', async ({ data = {} }) => {
    unreadCount.value++
    prepend({ id: data.id, title: data.title || '', content: data.content || '', type: data.notification_type || 'info', level: data.level || 'normal', link: data.link || '', is_read: UNREAD, created_at: data.created_at || new Date().toISOString() })
    if (data.level === 'urgent') {
      // Tauri 系统通知（窗口不可见时才触发）
      if (await shouldUseNative()) {
        const { invoke } = await import('@tauri-apps/api/core')
        invoke('send_notification', { title: data.title || t('notification.title'), body: data.content || '' })
      }
      // Web 通知
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
        <div class="header-left">
          <span class="title">{{ t('notification.title') }}</span>
          <span v-if="unreadCount > 0" class="unread-dot-label">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </div>
        <el-button v-if="unreadCount > 0" type="primary" link size="small" @click="markAllRead" class="mark-all-btn">
          <el-icon><Check /></el-icon>
          {{ t('notification.markAllRead') }}
        </el-button>
      </div>

      <!-- 列表 -->
      <div class="panel-body no-scrollbar" v-loading="loading && list.length === 0">
        <template v-if="list.length > 0">
          <transition-group name="list-fade">
            <div 
              v-for="(item, index) in list" 
              :key="item.id" 
              :class="[
                'notification-item', 
                { unread: item.is_read === UNREAD },
                { 'is-urgent': item.level === 'urgent' }
              ]" 
              @click="handleClick(item)"
            >
              <!-- 业务图标适配 -->
              <div class="item-icon-wrapper" :class="item.type">
                <el-icon v-if="item.type === 'success'"><Check /></el-icon>
                <el-icon v-else-if="item.type === 'error'"><Delete /></el-icon>
                <el-icon v-else><Bell /></el-icon>
              </div>

              <div class="item-content">
                <div class="item-title-row">
                  <div class="item-title">
                    <span class="unread-dot" v-if="item.is_read === UNREAD" />
                    {{ item.title }}
                  </div>
                  <div class="item-time">{{ formatTimeAgo(item.created_at) }}</div>
                </div>

                <div class="item-desc-wrapper">
                  <div 
                    class="item-desc" 
                    v-if="item.content"
                    :class="{ expanded: expandedItems.has(item.id) }"
                  >
                    {{ item.content }}
                  </div>
                  <div v-if="item.content && item.content.length > 40" class="expand-action" @click.stop="toggleExpand(item.id)">
                    {{ expandedItems.has(item.id) ? t('common.actions.collapse') : t('common.actions.expand') }}
                    <el-icon><component :is="expandedItems.has(item.id) ? ArrowUp : ArrowDown" /></el-icon>
                  </div>
                </div>

                <div class="item-footer">
                  <div class="tags">
                    <el-tag v-if="item.level === 'urgent'" size="small" type="warning" effect="plain" class="urgent-tag">
                      {{ t('notification.urgent') }}
                    </el-tag>
                    <span v-if="item.is_read === UNREAD" class="new-tag">{{ t('notification.new') }}</span>
                  </div>
                  <div class="actions">
                    <el-button v-if="item.link" type="primary" link size="small" class="go-btn">
                      {{ t('common.actions.detail') }}
                      <el-icon><ArrowRight /></el-icon>
                    </el-button>
                    <el-button type="danger" link size="small" class="delete-btn" @click.stop="handleDelete(item, index)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </transition-group>
          <div class="load-more" v-if="hasMore">
            <el-button type="primary" link :loading="loading" @click="loadMore">
              {{ t('notification.loadMore') }}
            </el-button>
          </div>
        </template>
        <el-empty v-else-if="!loading" :description="t('notification.empty')" :image-size="80" />
      </div>
    </div>
  </el-popover>
</template>

<style scoped lang="scss">
.notification-badge {
  display: flex;
  :deep(.el-badge__content) {
    top: 6px;
    right: 6px;
    border: none;
    box-shadow: 0 0 0 2px var(--el-bg-color);
  }
}

.trigger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 10px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: var(--el-fill-color-light);
    color: var(--el-color-primary);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.notification-panel {
  margin: -12px;
  background: var(--el-bg-color);
  border-radius: 12px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .title {
      font-weight: 700;
      font-size: 15px;
      color: var(--el-text-color-primary);
    }
    
    .unread-dot-label {
      padding: 0 6px;
      height: 18px;
      line-height: 18px;
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      border-radius: 10px;
      font-size: 11px;
      font-weight: 700;
    }
  }
  
  .mark-all-btn {
    font-weight: 600;
    font-size: 13px;
    &:hover {
      opacity: 0.8;
    }
  }
}

.panel-body {
  max-height: 480px;
  overflow-y: auto;
  padding: 8px 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 18px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 1px solid transparent;
  
  &:hover {
    background: var(--el-fill-color-light);
    .delete-btn { opacity: 1; }
  }
  
  &.unread {
    background: var(--el-color-primary-light-9);
    &:hover {
      background: var(--el-color-primary-light-8);
    }
  }
  
  &.is-urgent {
    border-left: 2px solid var(--el-color-warning);
  }
}

.item-icon-wrapper {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  border: 1px solid var(--el-border-color-lighter);
  
  &.success {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
    border-color: var(--el-color-success-light-8);
  }
  &.error {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
    border-color: var(--el-color-danger-light-8);
  }
}

.item-content {
  flex: 1;
  min-width: 0;
  
  .item-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    
    .item-title {
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      line-height: 1.4;
      
      .unread-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--el-color-primary);
        margin-right: 8px;
        flex-shrink: 0;
      }
    }
    
    .item-time {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      flex-shrink: 0;
    }
  }
}

.item-desc-wrapper {
  margin-bottom: 8px;
  
  .item-desc {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    transition: all 0.3s;
    
    &.expanded {
      -webkit-line-clamp: unset;
    }
  }
  
  .expand-action {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    font-size: 11px;
    font-weight: 700;
    color: var(--el-color-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.7;
    cursor: pointer;
    
    &:hover { opacity: 1; }
  }
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .tags {
    display: flex;
    align-items: center;
    gap: 6px;
    
    .urgent-tag {
      font-weight: 800;
      border-radius: 4px;
      padding: 0 6px;
      height: 18px;
    }
    
    .new-tag {
      font-size: 10px;
      font-weight: 800;
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-8);
      padding: 1px 4px;
      border-radius: 4px;
    }
  }
  
  .actions {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .go-btn {
      font-weight: 600;
      font-size: 12px;
      .el-icon { margin-left: 2px; }
    }
    
    .delete-btn {
      opacity: 0;
      transition: all 0.2s;
      font-size: 16px;
    }
  }
}

.load-more {
  text-align: center;
  padding: 16px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

/* 列表过渡动画 */
.list-fade-enter-active,
.list-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.list-fade-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.list-fade-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

@media (max-width: 768px) {
  .panel-body { max-height: 60vh; }
  .delete-btn { opacity: 1 !important; }
}
</style>
