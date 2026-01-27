<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Loading, Avatar } from '@element-plus/icons-vue'

const { t } = useI18n()

interface Agent {
  id: number
  name: string
  avatar?: string
  modalities?: any
}

const props = defineProps<{
  agents: Agent[]
  loading: boolean
  selectedId: number | null
}>()

const emit = defineEmits<{
  select: [agent: Agent]
}>()

const handleSelect = (agent: Agent) => {
  emit('select', agent)
}
</script>

<template>
  <div class="agent-sidebar">
    <!-- 标题 -->
    <div class="sidebar-header">
      <h3 class="sidebar-title">{{ t('aiChat.agentList') }}</h3>
    </div>

    <!-- 智能体列表 -->
    <el-scrollbar class="agent-list">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-tip">
        <el-icon class="is-loading" :size="20">
          <Loading />
        </el-icon>
        <span>{{ t('aiChat.loading') }}</span>
      </div>

      <!-- 空状态 -->
      <div v-else-if="agents.length === 0" class="empty-tip">
        <el-icon :size="48" class="empty-icon">
          <Avatar />
        </el-icon>
        <p>{{ t('aiChat.noAgent') }}</p>
      </div>

      <!-- 智能体列表 -->
      <template v-else>
        <div
          v-for="agent in agents"
          :key="agent.id"
          class="agent-item"
          :class="{ active: agent.id === selectedId }"
          @click="handleSelect(agent)"
        >
          <el-avatar
            :size="36"
            :src="agent.avatar"
            class="agent-avatar"
          >
            {{ agent.name?.charAt(0) || '?' }}
          </el-avatar>
          <span class="agent-name">{{ agent.name }}</span>
        </div>
      </template>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.agent-sidebar {
  width: 260px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
}

.sidebar-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.sidebar-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.agent-list {
  flex: 1;
  padding: 8px;
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
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin: 4px 0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.agent-item:hover {
  background: var(--el-fill-color-light);
}

.agent-item.active {
  background: var(--el-color-primary-light-9);
  border-left: 3px solid var(--el-color-primary);
  padding-left: 9px;
}

.agent-item.active .agent-name {
  color: var(--el-color-primary);
  font-weight: 500;
}

.agent-avatar {
  flex-shrink: 0;
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  font-weight: 600;
}

.agent-item.active .agent-avatar {
  background: var(--el-color-primary);
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
}
</style>
