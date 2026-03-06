<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Loading, Document, CircleCheck, CircleClose, ArrowDown, ArrowRight, UserFilled, Monitor } from '@element-plus/icons-vue'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import type { ChatMessage, ToolCall } from '../../composables/types'

const { t } = useI18n()

defineProps<{
  msg: ChatMessage
  msgIdx: number
  expandedDiffs: Record<string, boolean>
  toolDisplayName: (name: string) => string
}>()

const emit = defineEmits<{
  toggleToolCall: [tc: ToolCall]
  toggleDiff: [msgIdx: number, fileIdx: number]
}>()
</script>

<template>
  <!-- User message -->
  <div v-if="msg.role === 'user'" class="message user-msg">
    <div class="msg-avatar user-avatar">
      <el-icon :size="18"><UserFilled /></el-icon>
    </div>
    <div class="msg-bubble user-bubble">{{ msg.content }}</div>
  </div>

  <!-- AI message -->
  <div v-else class="message ai-msg">
    <div class="msg-avatar ai-avatar">
      <el-icon :size="18"><Monitor /></el-icon>
    </div>
    <div class="msg-body">
      <!-- Tool calls -->
      <div v-if="msg.tool_calls?.length" class="tool-calls">
        <div v-for="tc in msg.tool_calls" :key="tc.call_id" class="tool-card">
          <div class="tool-hd" @click="emit('toggleToolCall', tc)">
            <el-icon v-if="tc.status === 'calling'" class="tool-spin"><Loading /></el-icon>
            <el-icon v-else color="var(--el-color-success)"><CircleCheck /></el-icon>
            <span class="tool-name">{{ toolDisplayName(tc.tool_name) }}</span>
            <span class="tool-params" v-if="Object.keys(tc.tool_inputs || {}).length">
              ({{ Object.entries(tc.tool_inputs).map(([k, v]) => `${k}=${v}`).join(', ') }})
            </span>
            <el-icon class="tool-arrow">
              <ArrowDown v-if="!tc.collapsed" />
              <ArrowRight v-else />
            </el-icon>
          </div>
          <div v-if="!tc.collapsed && tc.tool_result" class="tool-result">
            <pre>{{ tc.tool_result.length > 500 ? tc.tool_result.slice(0, 500) + '...' : tc.tool_result }}</pre>
          </div>
        </div>
      </div>

      <!-- Markdown content -->
      <MarkdownRenderer v-if="msg.content" :content="msg.content" class="ai-content" />

      <!-- Streaming indicator -->
      <div v-if="msg.isStreaming && !msg.content" class="streaming-dots">
        <span></span><span></span><span></span>
      </div>

      <!-- Table results -->
      <div v-if="msg.tables?.length" class="results-area">
        <div v-for="(tbl, i) in msg.tables" :key="'t' + i" class="result-row">
          <el-icon v-if="tbl.success" color="var(--el-color-success)"><CircleCheck /></el-icon>
          <el-icon v-else color="var(--el-color-danger)"><CircleClose /></el-icon>
          <span v-if="tbl.altered">{{ t('aiCodeGen.result.alterTable', { name: tbl.table_name }) }}</span>
          <span v-else>{{ t('aiCodeGen.result.createTable', { name: tbl.table_name }) }}</span>
          <span v-if="tbl.error" class="result-error">{{ tbl.error }}</span>
        </div>
      </div>

      <!-- File results -->
      <div v-if="msg.files?.length" class="results-area">
        <div v-for="(f, i) in msg.files" :key="'f' + i" class="result-file-wrap">
          <div class="result-row">
            <el-icon v-if="f.success" color="var(--el-color-success)"><CircleCheck /></el-icon>
            <el-icon v-else color="var(--el-color-danger)"><CircleClose /></el-icon>
            <el-icon><Document /></el-icon>
            <span class="file-path">{{ f.path }}</span>
            <el-tag v-if="f.is_new" size="small" type="success">{{ t('aiCodeGen.result.newFile') }}</el-tag>
            <el-tag v-else-if="f.success && f.original" size="small" type="warning">{{ t('aiCodeGen.result.modified') }}</el-tag>
            <span v-if="f.error" class="result-error">{{ f.error }}</span>
            <el-button
              v-if="f.success && !f.is_new && f.original && f.original !== '[文件过大，不展示 diff]'"
              size="small"
              text
              @click="emit('toggleDiff', msgIdx, i)"
            >
              {{ expandedDiffs[`${msgIdx}-${i}`] ? t('aiCodeGen.result.hideDiff') : t('aiCodeGen.result.showDiff') }}
            </el-button>
          </div>
          <!-- Diff viewer -->
          <div v-if="expandedDiffs[`${msgIdx}-${i}`] && f.original && f.content" class="diff-viewer">
            <div class="diff-hd">
              <span class="diff-label old">{{ t('aiCodeGen.result.original') }}</span>
              <span class="diff-label new">{{ t('aiCodeGen.result.newContent') }}</span>
            </div>
            <div class="diff-body">
              <pre class="diff-code old">{{ f.original }}</pre>
              <pre class="diff-code new">{{ f.content }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Review content -->
      <div v-if="msg.reviewContent" class="extra-section review">
        <div class="extra-title">{{ t('aiCodeGen.reviewTitle') }}</div>
        <MarkdownRenderer :content="msg.reviewContent" />
      </div>

      <!-- Test content -->
      <div v-if="msg.testContent" class="extra-section test">
        <div class="extra-title">{{ t('aiCodeGen.testTitle') }}</div>
        <MarkdownRenderer :content="msg.testContent" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: flex-start;
}

.msg-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar {
  background: var(--el-color-primary);
  color: #fff;
}

.ai-avatar {
  background: var(--el-fill-color-dark);
  color: var(--el-text-color-primary);
}

.user-msg {
  flex-direction: row-reverse;
}

.msg-bubble {
  padding: 10px 16px;
  border-radius: 12px;
  max-width: 70%;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  font-size: 14px;
}

.user-bubble {
  background: var(--el-color-primary);
  color: #fff;
  border-radius: 12px 12px 0 12px;
}

.msg-body {
  max-width: 85%;
  min-width: 0;
}

/* Tool calls */
.tool-calls {
  margin-bottom: 12px;
}

.tool-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  margin-bottom: 6px;
  overflow: hidden;
  background: var(--el-bg-color);
}

.tool-hd {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-regular);
  transition: background 0.15s;
}

.tool-hd:hover {
  background: var(--el-fill-color-lighter);
}

.tool-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tool-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.tool-params {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.tool-arrow {
  margin-left: auto;
  color: var(--el-text-color-placeholder);
}

.tool-result {
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 8px 12px;
  max-height: 200px;
  overflow: auto;
}

.tool-result pre {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--el-text-color-secondary);
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}

/* AI content */
.ai-content {
  line-height: 1.7;
}

/* Streaming dots */
.streaming-dots {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.streaming-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
  animation: dot-bounce 1.4s ease-in-out infinite both;
}

.streaming-dots span:nth-child(1) { animation-delay: -0.32s; }
.streaming-dots span:nth-child(2) { animation-delay: -0.16s; }
.streaming-dots span:nth-child(3) { animation-delay: 0s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

/* Results */
.results-area {
  margin-top: 12px;
  padding: 10px 14px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 13px;
}

.result-error {
  color: var(--el-color-danger);
  font-size: 12px;
  margin-left: 4px;
}

.file-path {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12px;
  word-break: break-all;
}

/* Diff viewer */
.diff-viewer {
  margin-top: 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
}

.diff-hd {
  display: flex;
}

.diff-label {
  flex: 1;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.diff-label.old {
  background: rgba(var(--el-color-danger-rgb), 0.08);
  color: var(--el-color-danger);
  border-right: 1px solid var(--el-border-color-lighter);
}

.diff-label.new {
  background: rgba(var(--el-color-success-rgb), 0.08);
  color: var(--el-color-success);
}

.diff-body {
  display: flex;
  max-height: 400px;
  overflow: auto;
}

.diff-code {
  flex: 1;
  margin: 0;
  padding: 12px;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.diff-code.old {
  background: rgba(var(--el-color-danger-rgb), 0.03);
  border-right: 1px solid var(--el-border-color-lighter);
}

.diff-code.new {
  background: rgba(var(--el-color-success-rgb), 0.03);
}

/* Extra sections (review/test) */
.extra-section {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.extra-section.review {
  background: rgba(var(--el-color-info-rgb), 0.04);
  border-color: rgba(var(--el-color-info-rgb), 0.15);
}

.extra-section.test {
  background: rgba(var(--el-color-warning-rgb), 0.04);
  border-color: rgba(var(--el-color-warning-rgb), 0.15);
}

.extra-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
}
</style>
