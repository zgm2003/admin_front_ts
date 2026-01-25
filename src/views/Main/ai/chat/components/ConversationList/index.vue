<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Plus,
  Loading,
  MoreFilled,
  Edit,
  Delete,
  ChatDotRound,
  FolderOpened,
  FolderChecked
} from '@element-plus/icons-vue'
import { groupByTimeRange } from '@/utils/date'

const { t } = useI18n()
const scrollbarRef = ref<any>(null)

const props = defineProps<{
  conversations: any[]
  loading: boolean
  loadingMore?: boolean
  hasMore?: boolean
  currentId: number | null
  showArchived?: boolean
}>()

const emit = defineEmits<{
  select: [conv: any]
  create: []
  rename: [conv: any]
  delete: [conv: any]
  archive: [conv: any]
  loadMore: []
  toggleArchived: [showArchived: boolean]
}>()

// 滚动事件（滚到底部加载更多）
const handleScroll = () => {
  const wrap = scrollbarRef.value?.wrapRef
  if (!wrap) return
  const { scrollTop, scrollHeight, clientHeight } = wrap
  if (scrollHeight - scrollTop - clientHeight < 50 && !props.loadingMore && props.hasMore) {
    emit('loadMore')
  }
}

// 按日期分组（复用 utils/date）
const groupedConversations = computed(() => 
  groupByTimeRange(
    props.conversations,
    (conv) => conv.last_message_at || conv.created_at,
    {
      today: t('aiChat.timeGroup.today'),
      yesterday: t('aiChat.timeGroup.yesterday'),
      week: t('aiChat.timeGroup.lastWeek'),
      month: t('aiChat.timeGroup.lastMonth'),
      older: t('aiChat.timeGroup.older')
    }
  )
)
</script>

<template>
  <div class="sidebar">
    <!-- 新建按钮 -->
    <div class="sidebar-header">
      <el-button class="new-chat-btn" @click="emit('create')">
        <el-icon :size="18">
          <Plus/>
        </el-icon>
        <span>{{ t('aiChat.newConversation') }}</span>
      </el-button>
    </div>

    <!-- 归档切换标签 -->
    <div class="archive-tabs">
      <div
          class="tab-item"
          :class="{ active: !showArchived }"
          @click="emit('toggleArchived', false)"
      >
        {{ t('aiChat.tabNormal') }}
      </div>
      <div
          class="tab-item"
          :class="{ active: showArchived }"
          @click="emit('toggleArchived', true)"
      >
        <el-icon :size="14">
          <FolderOpened/>
        </el-icon>
        {{ t('aiChat.tabArchive') }}
      </div>
    </div>

    <!-- 会话列表 -->
    <el-scrollbar ref="scrollbarRef" class="conversation-list" @scroll="handleScroll">
      <div v-if="loading" class="loading-tip">
        <el-icon class="is-loading" :size="20">
          <Loading/>
        </el-icon>
        <span>{{ t('aiChat.loading') }}</span>
      </div>
      <div v-else-if="conversations.length === 0" class="empty-tip">
        <el-icon :size="48" class="empty-icon">
          <ChatDotRound/>
        </el-icon>
        <p>{{ t('aiChat.noConversation') }}</p>
        <p class="empty-hint">{{ t('aiChat.startNewChat') }}</p>
      </div>
      <template v-else>
        <div v-for="group in groupedConversations" :key="group.label" class="conversation-group">
          <div class="group-label">{{ group.label }}</div>
          <div
              v-for="conv in group.items"
              :key="conv.id"
              class="conversation-item"
              :class="{active: conv.id === currentId}"
              @click="emit('select', conv)"
          >
            <el-icon class="conv-icon" :size="16">
              <ChatDotRound/>
            </el-icon>
            <span class="conv-title">{{ conv.title || t('aiChat.untitled') }}</span>
            <el-dropdown trigger="click" @click.stop>
              <el-button text size="small" class="conv-menu-btn" @click.stop>
                <el-icon :size="16">
                  <MoreFilled/>
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="emit('rename', conv)">
                    <el-icon>
                      <Edit/>
                    </el-icon>
                    {{ t('aiChat.rename') }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="emit('archive', conv)">
                    <el-icon>
                      <component :is="showArchived ? FolderChecked : FolderOpened"/>
                    </el-icon>
                    {{ showArchived ? t('aiChat.doUnarchive') : t('aiChat.doArchive') }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="emit('delete', conv)" class="danger-item">
                    <el-icon>
                      <Delete/>
                    </el-icon>
                    {{ t('aiChat.delete') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        <!-- 加载更多提示 -->
        <div v-if="loadingMore" class="loading-more-tip">
          <el-icon class="is-loading" :size="16">
            <Loading/>
          </el-icon>
          <span>{{ t('aiChat.loading') }}</span>
        </div>
        <div v-else-if="!hasMore && conversations.length > 0" class="no-more-tip">
          {{ t('aiChat.noMoreConversations') }}
        </div>
      </template>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.sidebar {
  width: 260px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
}

.sidebar-header {
  padding: 12px;
}

.archive-tabs {
  display: flex;
  padding: 0 12px 8px;
  gap: 4px;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-item:hover {
  background: var(--el-fill-color-light);
}

.tab-item.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
}

.new-chat-btn {
  width: 100%;
  height: 44px;
  border: 1px dashed var(--el-border-color);
  border-radius: 10px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.new-chat-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.conversation-list {
  flex: 1;
  padding: 0 8px 12px;
}

.loading-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: var(--el-text-color-secondary);
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.empty-icon {
  color: var(--el-text-color-placeholder);
  margin-bottom: 12px;
}

.empty-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
}

.conversation-group {
  margin-bottom: 8px;
}

.group-label {
  padding: 8px 12px 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin: 2px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.conversation-item:hover {
  background: var(--el-fill-color-light);
}

.conversation-item.active {
  background: var(--el-color-primary-light-9);
}

.conversation-item.active .conv-icon,
.conversation-item.active .conv-title {
  color: var(--el-color-primary);
}

.conv-icon {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

.conv-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-menu-btn {
  flex-shrink: 0;
  opacity: 0;
  padding: 4px;
  border-radius: 6px;
  transition: opacity 0.15s ease;
}

.conversation-item:hover .conv-menu-btn {
  opacity: 1;
}

.conv-menu-btn:hover {
  background: var(--el-fill-color);
}

:deep(.danger-item) {
  color: var(--el-color-danger) !important;
}

:deep(.danger-item .el-icon) {
  color: var(--el-color-danger) !important;
}

.loading-more-tip,
.no-more-tip {
  text-align: center;
  padding: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.loading-more-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    min-width: 100%;
  }
}
</style>
