<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Loading, Check } from '@element-plus/icons-vue'
import type { ToolCallRecord } from '../composables/types'

const { t } = useI18n()

defineProps<{
  toolCalls: ToolCallRecord[]
}>()
</script>

<template>
  <div v-if="toolCalls?.length" class="tool-calls-area">
    <div v-for="tc in toolCalls" :key="tc.call_id" class="tool-call-item">
      <div class="tool-call-header" @click="tc._expanded = !tc._expanded">
        <el-icon v-if="tc.status === 'calling'" class="is-loading"><Loading /></el-icon>
        <el-icon v-else color="var(--el-color-success)"><Check /></el-icon>
        <span class="tool-call-label">
          {{ tc.status === 'calling' ? t('aiChat.toolCalling') : t('aiChat.toolDone') }}: {{ tc.tool_name }}
        </span>
      </div>
      <div v-if="tc._expanded && tc.tool_result" class="tool-call-result">
        <pre>{{ tc.tool_result }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-calls-area {
  margin: 8px 0;
}
.tool-call-item {
  margin-bottom: 4px;
}
.tool-call-header {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  transition: background 0.15s;
}
.tool-call-header:hover {
  background: var(--el-fill-color);
}
.tool-call-label {
  user-select: none;
}
.tool-call-result {
  margin: 4px 0 4px 28px;
  padding: 8px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
}
.tool-call-result pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  color: var(--el-text-color-regular);
}
</style>
