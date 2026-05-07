<script setup lang="ts">
interface ConversationListDisplayItem {
  avatar: string
  avatarText: string
  displayName: string
  displayTime: string
  preview: string
  unread_count: number
  unreadLabel: string
  pinned: boolean
}

defineProps<{
  item: ConversationListDisplayItem
}>()
</script>

<template>
  <div
    class="conversation-label"
    :class="{ 'is-pinned': item.pinned }"
  >
    <el-avatar
      :size="42"
      :src="item.avatar || undefined"
      class="conv-avatar"
    >
      {{ item.avatarText }}
    </el-avatar>

    <div class="conv-info">
      <div class="conv-top">
        <span class="conv-name">
          {{ item.displayName }}
        </span>
        <span class="conv-time">{{ item.displayTime }}</span>
      </div>

      <div class="conv-bottom">
        <span class="conv-preview">{{ item.preview }}</span>
        <el-badge
          v-if="item.unread_count > 0"
          :value="item.unreadLabel"
          class="conv-badge"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.conversation-label {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  user-select: none;
}

.conv-avatar {
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--el-color-primary-light-7), var(--el-color-primary-light-9));
  color: var(--el-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.conv-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.conv-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.conv-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-pinned .conv-name::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 6px;
  vertical-align: 1px;
  border-radius: 999px;
  background: var(--el-color-primary);
}

.conv-time {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.conv-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.conv-preview {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-badge :deep(.el-badge__content) {
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  padding: 0 5px;
  font-size: 11px;
  border: 0;
}
</style>
