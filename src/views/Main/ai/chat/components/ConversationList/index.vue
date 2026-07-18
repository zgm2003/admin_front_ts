<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChatDotRound, Delete, Loading, Plus } from '@element-plus/icons-vue'
import { groupByTimeRange } from '@/utils/date'
import type { Conversation } from '../../composables/types'

const { t } = useI18n()

interface ScrollWrapRef {
  wrapRef?: HTMLElement
}

const scrollbarRef = shallowRef<ScrollWrapRef | null>(null)

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
  delete: [conversation: Conversation]
  loadMore: []
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
          <button
            v-for="conversation in group.items"
            :key="conversation.id"
            class="conversation-item"
            :class="{ active: conversation.id === currentId }"
            type="button"
            @click="emit('select', conversation)"
          >
            <el-icon
              class="conversation-icon"
              :size="16"
            >
              <ChatDotRound />
            </el-icon>
            <span class="conversation-title">{{ conversation.title || t('aiChat.untitled') }}</span>
            <span class="conversation-time">{{ conversation.last_message_at || conversation.updated_at }}</span>
            <el-button
              text
              size="small"
              class="delete-btn"
              @click.stop="emit('delete', conversation)"
            >
              <el-icon :size="15">
                <Delete />
              </el-icon>
            </el-button>
          </button>
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
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
}

.conversation-header {
  padding: 12px;
}

.new-chat-btn {
  width: 100%;
  height: 42px;
  border: 1px dashed var(--el-border-color);
  border-radius: 10px;
  background: transparent;
}

.conversation-list {
  flex: 1;
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
  min-height: 240px;
  flex-direction: column;
  text-align: center;
}

.empty-tip p {
  margin: 8px 0 0;
  color: var(--el-text-color-primary);
}

.conversation-group {
  padding-top: 8px;
}

.group-label {
  padding: 8px 10px 4px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.conversation-item {
  width: 100%;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  gap: 2px 8px;
  align-items: center;
  padding: 9px 8px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--el-text-color-primary);
  text-align: left;
  cursor: pointer;
}

.conversation-item:hover,
.conversation-item.active {
  background: var(--el-fill-color-light);
}

.conversation-item.active {
  color: var(--el-color-primary);
}

.conversation-icon {
  grid-row: 1 / span 2;
}

.conversation-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.conversation-time {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.delete-btn {
  grid-row: 1 / span 2;
  opacity: 0;
}

.conversation-item:hover .delete-btn {
  opacity: 1;
}

@media (max-width: 768px) {
  .conversation-sidebar {
    width: 100%;
    min-width: 100%;
  }
}
</style>
