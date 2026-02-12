<script setup lang="ts">
import {ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {Loading, CopyDocument, Delete, RefreshRight, Edit} from '@element-plus/icons-vue'
import {MarkdownRenderer} from '@/components/MarkdownRenderer'
import {DIcon} from '@/components/DIcon'
import { CommonEnum, AiRoleEnum } from '@/enums'

const {t} = useI18n()

// 附件类型
interface Attachment {
  type: 'image'
  url: string
  name: string
  size: number
}

const props = defineProps<{
  messages: any[]
  loading: boolean
  sending?: boolean
}>()

const emit = defineEmits<{
  copy: [msg: any]
  delete: [msg: any]
  regenerate: [msg: any]
  edit: [msg: any, newContent: string]
  feedback: [msg: any, feedback: number | null]
}>()

// 编辑状态
const editingMsgId = ref<number | null>(null)
const editContent = ref('')

// 是否可编辑（仅用户消息 + 非流式中 + 有真实 id）
const canEdit = (msg: any) => {
  return msg.role === AiRoleEnum.USER && !msg.isStreaming && msg.id > 0 && !props.sending
}

const startEdit = (msg: any) => {
  editingMsgId.value = msg.id
  editContent.value = msg.content
}

const cancelEdit = () => {
  editingMsgId.value = null
  editContent.value = ''
}

const confirmEdit = (msg: any) => {
  const trimmed = editContent.value.trim()
  if (!trimmed || trimmed === msg.content) {
    cancelEdit()
    return
  }
  emit('edit', msg, trimmed)
  cancelEdit()
}

// 图片预览相关
const previewVisible = ref(false)
const previewImages = ref<string[]>([])
const previewIndex = ref(0)

// 图片加载状态 Map: url -> 'loading' | 'loaded' | 'error'
const imageLoadingStates = ref<Map<string, string>>(new Map())

// 从消息中提取附件
const getAttachments = (msg: any): Attachment[] => {
  return msg.meta_json?.attachments || []
}

// 获取图片加载状态
const getImageLoadingState = (url: string): string => {
  return imageLoadingStates.value.get(url) || 'loading'
}

// 图片加载完成
const handleImageLoad = (url: string) => {
  imageLoadingStates.value.set(url, 'loaded')
}

// 图片加载失败
const handleImageError = (url: string) => {
  imageLoadingStates.value.set(url, 'error')
}

// 点击图片预览
const handleImageClick = (msg: any, index: number) => {
  const attachments = getAttachments(msg)
  previewImages.value = attachments.map(a => a.url)
  previewIndex.value = index
  previewVisible.value = true
}

// 关闭预览
const closePreview = () => {
  previewVisible.value = false
}

// 是否显示重新生成按钮（只有最后一条 AI 消息才显示）
const showRegenerate = (msg: any, index: number) => {
  if (msg.role === AiRoleEnum.USER) return false
  if (msg.isStreaming) return false
  for (let i = props.messages.length - 1; i >= 0; i--) {
    if (props.messages[i].role !== AiRoleEnum.USER) {
      return i === index
    }
  }
  return false
}

// 获取消息的反馈状态
const getFeedback = (msg: any): number | null => {
  return msg.meta_json?.feedback ?? null
}

// 点击反馈按钮
const handleFeedback = (msg: any, feedback: number) => {
  const current = getFeedback(msg)
  emit('feedback', msg, current === feedback ? null : feedback)
}
</script>

<template>
  <div class="message-list-container">
    <!-- 只在没有消息且正在加载时显示 loading -->
    <div v-if="loading && messages.length === 0" class="loading-tip">
      <el-icon class="is-loading" :size="24"><Loading/></el-icon>
      <span>{{ t('aiChat.loading') }}</span>
    </div>
    <!-- 消息列表 - 豆包风格单列文档流 -->
    <div v-else class="message-list">
      <template v-for="(msg, index) in messages" :key="msg.id">
        <!-- ====== 用户消息：横条卡片 ====== -->
        <div v-if="msg.role === AiRoleEnum.USER" class="user-block">
          <!-- 用户消息图片附件 -->
          <div v-if="getAttachments(msg).length > 0" class="user-attachments">
            <div
              v-for="(attachment, idx) in getAttachments(msg)"
              :key="idx"
              class="attachment-image-wrapper"
            >
              <div v-if="getImageLoadingState(attachment.url) === 'loading'" class="attachment-loading">
                <el-icon class="is-loading" :size="20"><Loading /></el-icon>
              </div>
              <img
                :src="attachment.url"
                :alt="attachment.name"
                class="attachment-image"
                :class="{ 'image-loaded': getImageLoadingState(attachment.url) === 'loaded' }"
                @load="handleImageLoad(attachment.url)"
                @error="handleImageError(attachment.url)"
                @click="handleImageClick(msg, idx)"
              />
            </div>
          </div>
          <!-- 编辑模式 -->
          <div v-if="editingMsgId === msg.id" class="user-card editing">
            <el-input
              v-model="editContent"
              type="textarea"
              :autosize="{ minRows: 1, maxRows: 8 }"
              class="edit-textarea"
              @keydown.enter.exact.prevent="confirmEdit(msg)"
              @keydown.escape="cancelEdit"
            />
            <div class="edit-actions">
              <el-button size="small" @click="cancelEdit">{{ t('common.actions.cancel') }}</el-button>
              <el-button size="small" type="primary" @click="confirmEdit(msg)">{{ t('aiChat.editSubmit') }}</el-button>
            </div>
          </div>
          <!-- 正常显示 -->
          <div v-else class="user-card">
            <span class="user-text">{{ msg.content }}</span>
          </div>
          <!-- 用户消息操作 -->
          <div class="msg-actions user-actions" v-if="!msg.isStreaming && editingMsgId !== msg.id">
            <button v-if="canEdit(msg)" class="action-btn" @click="startEdit(msg)" :title="t('aiChat.editMessage')">
              <el-icon :size="15"><Edit /></el-icon>
            </button>
            <button class="action-btn" @click="emit('copy', msg)" :title="t('aiChat.copyMessage')">
              <el-icon :size="15"><CopyDocument /></el-icon>
            </button>
            <button class="action-btn" @click="emit('delete', msg)" :title="t('aiChat.deleteMessage')">
              <el-icon :size="15"><Delete /></el-icon>
            </button>
          </div>
        </div>

        <!-- ====== AI 消息：全宽平铺 ====== -->
        <div v-else class="ai-block">
          <MarkdownRenderer :content="msg.content" class="ai-content"/>

          <!-- 流式输出指示器 -->
          <div v-if="msg.isStreaming" class="streaming-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>

          <!-- AI 消息操作 -->
          <div class="msg-actions ai-actions" v-if="!msg.isStreaming">
            <!-- 点赞/点踩 -->
            <button
              class="action-btn"
              :class="{ 'like-active': getFeedback(msg) === CommonEnum.YES }"
              @click="handleFeedback(msg, 1)"
              title="赞"
            >
              <DIcon icon="mdi:thumb-up" :size="15" />
            </button>
            <button
              class="action-btn"
              :class="{ 'dislike-active': getFeedback(msg) === CommonEnum.NO }"
              @click="handleFeedback(msg, 2)"
              title="踩"
            >
              <DIcon icon="mdi:thumb-down" :size="15" />
            </button>
            <span class="action-divider"></span>
            <button class="action-btn" @click="emit('copy', msg)" :title="t('aiChat.copyMessage')">
              <el-icon :size="15"><CopyDocument /></el-icon>
            </button>
            <button class="action-btn" @click="emit('delete', msg)" :title="t('aiChat.deleteMessage')">
              <el-icon :size="15"><Delete /></el-icon>
            </button>
            <button
              v-if="showRegenerate(msg, index)"
              class="action-btn"
              :disabled="sending"
              @click="emit('regenerate', msg)"
              :title="t('aiChat.regenerate')"
            >
              <el-icon :size="15"><RefreshRight /></el-icon>
            </button>
          </div>
        </div>

        <!-- 消息分隔线（AI 消息后面，且不是最后一条） -->
        <div v-if="msg.role !== AiRoleEnum.USER && index < messages.length - 1" class="msg-divider"></div>
      </template>
    </div>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="previewImages"
      :initial-index="previewIndex"
      @close="closePreview"
    />
  </div>
</template>

<style scoped>
.message-list-container {
  height: 100%;
  overflow-y: auto;
}

.loading-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  color: var(--el-text-color-secondary);
}

.message-list {
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  max-width: 768px;
  margin: 0 auto;
}

/* ====== 用户消息块 ====== */
.user-block {
  padding: 0 16px;
  margin-bottom: 24px;
}

.user-card {
  background: var(--el-fill-color-light);
  border-radius: 12px;
  padding: 14px 18px;
  font-size: 15px;
  line-height: 1.75;
  color: var(--el-text-color-primary);
  word-break: break-word;
  white-space: pre-wrap;
  position: relative;
}

.user-card.editing {
  background: var(--el-fill-color);
  border: 1px solid var(--el-color-primary-light-5);
}

.user-text {
  display: block;
}

/* 用户附件 */
.user-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  padding: 0 16px;
}

.attachment-image-wrapper {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-fill-color-light);
  min-width: 60px;
  min-height: 60px;
}

.attachment-loading {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.attachment-image {
  display: block;
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.3s ease;
  opacity: 0;
}

.attachment-image.image-loaded {
  opacity: 1;
}

/* 编辑模式 */
.edit-textarea :deep(.el-textarea__inner) {
  background: transparent;
  border: none;
  box-shadow: none;
  font-size: 15px;
  line-height: 1.75;
  padding: 0;
  resize: none;
  color: var(--el-text-color-primary);
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

/* ====== AI 消息块 ====== */
.ai-block {
  padding: 0 16px;
  margin-bottom: 8px;
}

.ai-content {
  font-size: 15px;
  line-height: 1.85;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

/* ====== 操作按钮 - 豆包风格 ====== */
.msg-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.user-block:hover .msg-actions,
.ai-block:hover .msg-actions {
  opacity: 1;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.like-active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.action-btn.dislike-active {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.action-divider {
  width: 1px;
  height: 14px;
  background: var(--el-border-color-lighter);
  margin: 0 4px;
}

/* ====== 分隔线 ====== */
.msg-divider {
  height: 1px;
  background: var(--el-border-color-extra-light);
  margin: 16px 16px 24px;
}

/* ====== 流式输出指示器 ====== */
.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  padding-left: 2px;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* ====== 移动端适配 ====== */
@media (max-width: 768px) {
  .message-list { padding: 16px 0; }
  .user-block, .ai-block { padding: 0 12px; }
  .msg-divider { margin: 12px 12px 20px; }
  .user-card { padding: 12px 14px; font-size: 14px; }
  .ai-content { font-size: 14px; }
  .user-attachments { padding: 0 12px; }
  .attachment-image { max-width: 160px; max-height: 120px; }
}
</style>
