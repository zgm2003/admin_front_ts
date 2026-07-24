<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Loading, Avatar } from '@element-plus/icons-vue'
import type { Agent } from '../../composables/types'

const { t } = useI18n()

defineProps<{
  agents: Agent[]
  loading: boolean
  selectedId: number | null
  compact?: boolean
}>()

const emit = defineEmits<{
  select: [agent: Agent]
}>()

const handleSelect = (agent: Agent) => {
  emit('select', agent)
}
</script>

<template>
  <div
    class="agent-sidebar"
    :class="{ compact }"
  >
    <!-- 标题 -->
    <div class="sidebar-header">
      <h3 class="sidebar-title">
        {{ t('aiChat.agentList') }}
      </h3>
    </div>

    <!-- 智能体列表 -->
    <el-scrollbar class="agent-list">
      <!-- 加载状态 -->
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

      <!-- 空状态 -->
      <div
        v-else-if="agents.length === 0"
        class="empty-tip"
      >
        <el-icon
          :size="48"
          class="empty-icon"
        >
          <Avatar />
        </el-icon>
        <p>{{ t('aiChat.noAgent') }}</p>
      </div>

      <!-- 智能体列表 -->
      <template v-else>
        <button
          v-for="agent in agents"
          :key="agent.id"
          type="button"
          class="agent-item"
          :class="{ active: agent.id === selectedId }"
          @click="handleSelect(agent)"
        >
          <el-avatar
            :size="36"
            :src="agent.avatar || undefined"
            class="agent-avatar"
          >
            {{ agent.name?.charAt(0) || '?' }}
          </el-avatar>
          <span class="agent-name">{{ agent.name }}</span>
        </button>
      </template>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.agent-sidebar {
  width: 238px;
  min-width: 238px;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
}

.sidebar-header {
  min-height: 64px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.agent-sidebar.compact {
  width: 100%;
  min-width: 0;
  max-height: 220px;
  flex: 0 0 auto;
  border-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: transparent;
}

.agent-sidebar.compact .sidebar-header {
  min-height: 52px;
  padding: 0 14px;
}

.agent-sidebar.compact .agent-list {
  max-height: 168px;
  padding: 4px 8px 10px;
}

.agent-sidebar.compact .agent-item {
  padding: 8px 9px;
}

.sidebar-title {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  color: var(--el-text-color-primary);
}

.agent-list {
  flex: 1;
  padding: 10px;
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

.agent-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  margin: 2px 0;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease, color 150ms ease;
}

.agent-item:hover {
  background: var(--el-fill-color-light);
}

.agent-item:focus-visible {
  outline: 3px solid var(--el-color-primary-light-8);
  outline-offset: 1px;
}

.agent-item.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.agent-item.active .agent-name {
  color: var(--el-color-primary);
  font-weight: 500;
}

.agent-avatar {
  flex-shrink: 0;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  font-weight: 600;
}

.agent-item.active .agent-avatar {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #fff;
}

.agent-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .agent-sidebar { width: 100%; min-width: 100%; }

  .sidebar-header {
    min-height: 58px;
  }
}
</style>
