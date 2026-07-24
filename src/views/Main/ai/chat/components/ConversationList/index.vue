<script setup lang="ts">
import { computed, onUnmounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChatDotRound, Delete, Edit, Loading, MoreFilled, Plus, Search } from '@element-plus/icons-vue'
import { groupByTimeRange } from '@/utils/date'
import type { Conversation } from '../../composables/types'

const { t } = useI18n()

interface ScrollWrapRef {
  wrapRef?: HTMLElement
}

const scrollbarRef = shallowRef<ScrollWrapRef | null>(null)
const searchInput = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

const props = defineProps<{
  conversations: Conversation[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  currentId: number | null
}>()

const emit = defineEmits<{
  select: [conversation: Conversation]
  create: []
  rename: [conversation: Conversation]
  delete: [conversation: Conversation]
  loadMore: []
  search: [keyword: string]
}>()

const groupedConversations = computed(() => groupByTimeRange(
  props.conversations,
  (conversation) => conversation.last_message_at || conversation.updated_at,
  {
    today: t('aiChat.timeGroup.today'),
    yesterday: t('aiChat.timeGroup.yesterday'),
    week: t('aiChat.timeGroup.lastWeek'),
    month: t('aiChat.timeGroup.lastMonth'),
    older: t('aiChat.timeGroup.older'),
  },
))

function handleScroll() {
  const wrap = scrollbarRef.value?.wrapRef
  if (!wrap || props.loadingMore || !props.hasMore) return

  const distance = wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight
  if (distance < 60) emit('loadMore')
}

function handleSearchInput(value: string) {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => emit('search', value.trim()), 300)
}

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<template>
  <aside class="conversation-sidebar">
    <div class="conversation-header">
      <el-button
        class="new-chat-btn"
        @click="emit('create')"
      >
        <el-icon :size="18">
          <Plus />
        </el-icon>
        <span>{{ t('aiChat.newConversation') }}</span>
      </el-button>
      <el-input
        v-model="searchInput"
        class="conversation-search"
        :placeholder="t('aiChat.searchPlaceholder')"
        :prefix-icon="Search"
        clearable
        @input="handleSearchInput"
        @clear="emit('search', '')"
      />
    </div>

    <el-scrollbar
      ref="scrollbarRef"
      class="conversation-list"
      @scroll="handleScroll"
    >
      <div
        v-if="loading"
        class="state-tip"
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
        class="state-tip empty-tip"
      >
        <el-icon :size="44">
          <ChatDotRound />
        </el-icon>
        <p>{{ t('aiChat.noConversation') }}</p>
        <span>{{ t('aiChat.startNewChat') }}</span>
      </div>

      <template v-else>
        <section
          v-for="group in groupedConversations"
          :key="group.label"
          class="conversation-group"
        >
          <div class="group-label">
            {{ group.label }}
          </div>
          <div
            v-for="conversation in group.items"
            :key="conversation.id"
            class="conversation-item"
            :class="{ active: conversation.id === currentId }"
          >
            <button
              type="button"
              class="conversation-main"
              @click="emit('select', conversation)"
            >
              <el-icon
                class="conversation-icon"
                :size="16"
              >
                <ChatDotRound />
              </el-icon>
              <span class="conversation-title">{{ conversation.title || t('aiChat.untitled') }}</span>
            </button>
            <el-dropdown
              trigger="click"
              @click.stop
            >
              <el-button
                text
                class="conversation-menu"
                :title="t('common.actions.action')"
                :aria-label="t('common.actions.action')"
                @click.stop
              >
                <el-icon :size="16">
                  <MoreFilled />
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="emit('rename', conversation)">
                    <el-icon><Edit /></el-icon>
                    {{ t('aiChat.rename') }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="emit('delete', conversation)">
                    <el-icon><Delete /></el-icon>
                    {{ t('aiChat.delete') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </section>

        <div
          v-if="loadingMore"
          class="load-more-tip"
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
          v-else-if="!hasMore"
          class="load-more-tip"
        >
          {{ t('aiChat.noMoreConversations') }}
        </div>
      </template>
    </el-scrollbar>
  </aside>
</template>

<style scoped>
.conversation-sidebar {
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.conversation-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 10px 8px;
}

.new-chat-btn {
  width: 100%;
  height: 40px;
  justify-content: flex-start;
  margin: 0;
  padding: 0 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
}

.new-chat-btn:hover,
.new-chat-btn:focus-visible {
  border-color: var(--el-color-primary-light-6);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.conversation-search :deep(.el-input__wrapper) {
  min-height: 36px;
  border-radius: 8px;
  background: var(--el-bg-color);
  box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
}

.conversation-list {
  flex: 1;
  min-height: 0;
  padding: 0 8px 12px;
}

.state-tip,
.load-more-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.empty-tip {
  min-height: 180px;
  flex-direction: column;
  text-align: center;
}

.empty-tip p {
  margin: 8px 0 0;
  color: var(--el-text-color-primary);
}

.conversation-group {
  padding-top: 6px;
}

.group-label {
  padding: 8px 9px 4px;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  font-weight: 500;
}

.conversation-item {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 2px 0;
  padding: 3px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--el-text-color-primary);
  transition: border-color 140ms ease, background 140ms ease;
}

.conversation-item:hover {
  background: var(--el-fill-color-light);
}

.conversation-item.active {
  border-color: var(--el-border-color-lighter);
  background: var(--el-bg-color);
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
}

.conversation-main {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.conversation-main:focus-visible {
  outline: 3px solid var(--el-color-primary-light-8);
  outline-offset: 0;
}

.conversation-item.active .conversation-icon {
  color: var(--el-color-primary);
}

.conversation-icon {
  flex: 0 0 auto;
  color: var(--el-text-color-placeholder);
}

.conversation-title {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-menu {
  flex: 0 0 auto;
  width: 30px;
  min-width: 30px;
  height: 30px;
  min-height: 30px;
  padding: 0;
  border-radius: 6px;
  opacity: 0;
}

.conversation-item:hover .conversation-menu,
.conversation-item:focus-within .conversation-menu,
.conversation-item.active .conversation-menu {
  opacity: 1;
}

@media (hover: none) {
  .conversation-menu {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .conversation-item {
    transition: none;
  }
}

@media (max-width: 768px) {
  .conversation-sidebar {
    width: 100%;
    min-width: 100%;
  }
}
</style>
