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
  Close,
  Search
} from '@element-plus/icons-vue'
import type { Conversation } from '../../composables/types'

const { t } = useI18n()
interface ScrollWrapRef {
  wrapRef?: HTMLElement
}

const scrollbarRef = ref<ScrollWrapRef | null>(null)
const searchInput = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

const props = defineProps<{
  visible: boolean
  conversations: Conversation[]
  loading: boolean
  loadingMore?: boolean
  hasMore?: boolean
  currentId: number | null
  agentName?: string
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  select: [conv: Conversation]
  create: []
  rename: [conv: Conversation]
  delete: [conv: Conversation]
  loadMore: []
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
          <span
            v-if="agentName"
            class="agent-badge"
          >{{ agentName }}</span>
        </div>
        <el-button
          text
          class="close-btn"
          @click="handleClose"
        >
          <el-icon :size="18">
            <Close />
          </el-icon>
        </el-button>
      </div>

      <!-- 新建按钮 -->
      <div class="drawer-actions">
        <el-button
          class="new-chat-btn"
          @click="handleCreate"
        >
          <el-icon :size="16">
            <Plus />
          </el-icon>
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

      <!-- 会话列表 -->
      <el-scrollbar
        ref="scrollbarRef"
        class="conversation-list"
        @scroll="handleScroll"
      >
        <div
          v-if="loading"
          class="loading-tip"
        >
          <el-icon
            class="is-loading"
            :size="20"
          >
            <Loading />
          </el-icon>
          <span>{{ t('aiChat.loading') }}</span>
        </div>

        <div
          v-else-if="conversations.length === 0"
          class="empty-tip"
        >
          <el-icon
            :size="40"
            class="empty-icon"
          >
            <ChatDotRound />
          </el-icon>
          <p>{{ t('aiChat.noConversation') }}</p>
          <p class="empty-hint">
            {{ t('aiChat.startNewChat') }}
          </p>
        </div>

        <template v-else>
          <div
            v-for="group in groupedConversations"
            :key="group.label"
            class="conversation-group"
          >
            <div class="group-label">
              {{ group.label }}
            </div>
            <div
              v-for="conv in group.items"
              :key="conv.id"
              class="conversation-item"
              :class="{ active: conv.id === currentId }"
              @click="handleSelect(conv)"
            >
              <el-icon
                class="conv-icon"
                :size="16"
              >
                <ChatDotRound />
              </el-icon>
              <span class="conv-title">{{ conv.title || t('aiChat.untitled') }}</span>
              <el-dropdown
                trigger="click"
                @click.stop
              >
                <el-button
                  text
                  size="small"
                  class="conv-menu-btn"
                  @click.stop
                >
                  <el-icon :size="16">
                    <MoreFilled />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="emit('rename', conv)">
                      <el-icon><Edit /></el-icon>
                      {{ t('aiChat.rename') }}
                    </el-dropdown-item>
                    <el-dropdown-item
                      class="danger-item"
                      @click="emit('delete', conv)"
                    >
                      <el-icon><Delete /></el-icon>
                      {{ t('aiChat.delete') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <div
            v-if="loadingMore"
            class="loading-more-tip"
          >
            <el-icon
              class="is-loading"
              :size="16"
            >
              <Loading />
            </el-icon>
            <span>{{ t('aiChat.loading') }}</span>
          </div>
          <div
            v-else-if="!hasMore && conversations.length > 0"
            class="no-more-tip"
          >
            {{ t('aiChat.noMoreConversations') }}
          </div>
        </template>
      </el-scrollbar>
    </div>
  </el-drawer>
</template>


<style scoped src="./styles.css"></style>
