<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Plus,
  Loading,
  MoreFilled,
  Edit,
  Delete,
  ChatDotRound,
  FolderOpened,
  FolderChecked,
  Close,
  Search
} from '@element-plus/icons-vue'

const { t } = useI18n()
const scrollbarRef = ref<any>(null)
const searchInput = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

interface Conversation {
  id: number
  title: string
  agent_id?: number
  agent_name?: string
  last_message_at: string
  status?: number
}

const props = defineProps<{
  visible: boolean
  conversations: Conversation[]
  loading: boolean
  loadingMore?: boolean
  hasMore?: boolean
  currentId: number | null
  agentName?: string
  showArchived?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  select: [conv: Conversation]
  create: []
  rename: [conv: Conversation]
  delete: [conv: Conversation]
  archive: [conv: Conversation]
  loadMore: []
  toggleArchived: [showArchived: boolean]
  search: [keyword: string]
}>()

const handleClose = () => {
  emit('update:visible', false)
}

// 防抖搜索（300ms）
const handleSearchInput = (val: string) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    emit('search', val.trim())
  }, 300)
}

const handleSelect = (conv: Conversation) => {
  emit('select', conv)
  emit('update:visible', false)
}

const handleCreate = () => {
  emit('create')
  emit('update:visible', false)
}

// 滚动加载更多
const handleScroll = () => {
  const wrap = scrollbarRef.value?.wrapRef
  if (!wrap) return

  const { scrollTop, scrollHeight, clientHeight } = wrap
  if (scrollHeight - scrollTop - clientHeight < 50) {
    if (!props.loadingMore && props.hasMore) {
      emit('loadMore')
    }
  }
}

// 按日期分组（复用 ConversationList 逻辑）
const groupedConversations = computed(() => {
  const groups: { label: string; items: Conversation[] }[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(today)
  monthAgo.setMonth(monthAgo.getMonth() - 1)

  const todayItems: Conversation[] = []
  const yesterdayItems: Conversation[] = []
  const weekItems: Conversation[] = []
  const monthItems: Conversation[] = []
  const olderItems: Conversation[] = []

  props.conversations.forEach((conv) => {
    const d = new Date(conv.last_message_at || '')
    d.setHours(0, 0, 0, 0)
    if (d >= today) {
      todayItems.push(conv)
    } else if (d >= yesterday) {
      yesterdayItems.push(conv)
    } else if (d >= weekAgo) {
      weekItems.push(conv)
    } else if (d >= monthAgo) {
      monthItems.push(conv)
    } else {
      olderItems.push(conv)
    }
  })

  if (todayItems.length) groups.push({ label: t('aiChat.timeGroup.today'), items: todayItems })
  if (yesterdayItems.length) groups.push({ label: t('aiChat.timeGroup.yesterday'), items: yesterdayItems })
  if (weekItems.length) groups.push({ label: t('aiChat.timeGroup.lastWeek'), items: weekItems })
  if (monthItems.length) groups.push({ label: t('aiChat.timeGroup.lastMonth'), items: monthItems })
  if (olderItems.length) groups.push({ label: t('aiChat.timeGroup.older'), items: olderItems })

  return groups
})
</script>

<template>
  <el-drawer
    :model-value="visible"
    direction="rtl"
    size="320px"
    :show-close="false"
    :with-header="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="drawer-container">
      <!-- 头部 -->
      <div class="drawer-header">
        <div class="header-title">
          <span>{{ t('aiChat.historyConversations') }}</span>
          <span v-if="agentName" class="agent-badge">{{ agentName }}</span>
        </div>
        <el-button text class="close-btn" @click="handleClose">
          <el-icon :size="18"><Close /></el-icon>
        </el-button>
      </div>

      <!-- 新建按钮 -->
      <div class="drawer-actions">
        <el-button class="new-chat-btn" @click="handleCreate">
          <el-icon :size="16"><Plus /></el-icon>
          <span>{{ t('aiChat.newConversation') }}</span>
        </el-button>
      </div>

      <!-- 搜索框 -->
      <div class="search-box">
        <el-input
          v-model="searchInput"
          :placeholder="t('aiChat.searchPlaceholder')"
          clearable
          :prefix-icon="Search"
          size="small"
          @input="handleSearchInput"
          @clear="emit('search', '')"
        />
      </div>

      <!-- 归档切换 -->
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
          <el-icon :size="14"><FolderOpened /></el-icon>
          {{ t('aiChat.tabArchive') }}
        </div>
      </div>

      <!-- 会话列表 -->
      <el-scrollbar ref="scrollbarRef" class="conversation-list" @scroll="handleScroll">
        <div v-if="loading" class="loading-tip">
          <el-icon class="is-loading" :size="20"><Loading /></el-icon>
          <span>{{ t('aiChat.loading') }}</span>
        </div>

        <div v-else-if="conversations.length === 0" class="empty-tip">
          <el-icon :size="40" class="empty-icon"><ChatDotRound /></el-icon>
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
              :class="{ active: conv.id === currentId }"
              @click="handleSelect(conv)"
            >
              <el-icon class="conv-icon" :size="16"><ChatDotRound /></el-icon>
              <span class="conv-title">{{ conv.title || t('aiChat.untitled') }}</span>
              <el-dropdown trigger="click" @click.stop>
                <el-button text size="small" class="conv-menu-btn" @click.stop>
                  <el-icon :size="16"><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="emit('rename', conv)">
                      <el-icon><Edit /></el-icon>
                      {{ t('aiChat.rename') }}
                    </el-dropdown-item>
                    <el-dropdown-item @click="emit('archive', conv)">
                      <el-icon>
                        <component :is="showArchived ? FolderChecked : FolderOpened" />
                      </el-icon>
                      {{ showArchived ? t('aiChat.doUnarchive') : t('aiChat.doArchive') }}
                    </el-dropdown-item>
                    <el-dropdown-item @click="emit('delete', conv)" class="danger-item">
                      <el-icon><Delete /></el-icon>
                      {{ t('aiChat.delete') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <div v-if="loadingMore" class="loading-more-tip">
            <el-icon class="is-loading" :size="16"><Loading /></el-icon>
            <span>{{ t('aiChat.loading') }}</span>
          </div>
          <div v-else-if="!hasMore && conversations.length > 0" class="no-more-tip">
            {{ t('aiChat.noMoreConversations') }}
          </div>
        </template>
      </el-scrollbar>
    </div>
  </el-drawer>
</template>


<style scoped>
.drawer-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.agent-badge {
  font-size: 12px;
  font-weight: 400;
  padding: 2px 8px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-radius: 10px;
}

.close-btn {
  padding: 4px;
}

.drawer-actions {
  padding: 12px 16px 8px;
}

.new-chat-btn {
  width: 100%;
  height: 40px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.new-chat-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.archive-tabs {
  display: flex;
  padding: 0 16px 8px;
  gap: 4px;
}

.search-box {
  padding: 0 16px 8px;
}

.search-box :deep(.el-input__wrapper) {
  border-radius: 8px;
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
  padding: 40px 24px;
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
</style>
