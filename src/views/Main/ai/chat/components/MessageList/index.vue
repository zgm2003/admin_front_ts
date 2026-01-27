<script setup lang="ts">
import {ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {Loading, CopyDocument, Delete, RefreshRight} from '@element-plus/icons-vue'
import {MarkdownRenderer} from '@/components/MarkdownRenderer'
import {Icon} from '@iconify/vue'
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
  feedback: [msg: any, feedback: number | null]  // 1=点赞 2=点踩 null=取消
}>()

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
  // 点击已选中的反馈则取消
  emit('feedback', msg, current === feedback ? null : feedback)
}
</script>

<template>
  <div class="message-list-container">
    <!-- 只在没有消息且正在加载时显示 loading -->
    <div v-if="loading && messages.length === 0" class="loading-tip">
      <el-icon class="is-loading" :size="24">
        <Loading/>
      </el-icon>
      <span>{{ t('aiChat.loading') }}</span>
    </div>
    <!-- 有消息时始终显示消息列表 -->
    <div v-else class="message-list">
      <div
          v-for="(msg, index) in messages"
          :key="msg.id"
          class="message-row"
          :class="{'user-row': msg.role === AiRoleEnum.USER}"
      >
        <!-- 消息内容区 -->
        <div class="message-body" :class="{'user-body': msg.role === AiRoleEnum.USER}">
          <div class="message-bubble" :class="msg.role === AiRoleEnum.USER ? 'user-bubble' : 'ai-bubble'">
            <!-- 用户消息图片附件 -->
            <div v-if="msg.role === AiRoleEnum.USER && getAttachments(msg).length > 0" class="message-attachments">
              <div 
                v-for="(attachment, idx) in getAttachments(msg)" 
                :key="idx" 
                class="attachment-image-wrapper"
              >
                <!-- Loading 占位符 -->
                <div 
                  v-if="getImageLoadingState(attachment.url) === 'loading'" 
                  class="attachment-loading"
                >
                  <el-icon class="is-loading" :size="24">
                    <Loading />
                  </el-icon>
                </div>
                <!-- 图片 -->
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
            <!-- 用户消息纯文本，AI 消息用 Markdown 渲染 -->
            <div v-if="msg.role === AiRoleEnum.USER" class="message-text">{{ msg.content }}</div>
            <MarkdownRenderer v-else :content="msg.content" class="message-text"/>
          </div>

          <!-- 操作按钮 - 仅 hover 时显示 -->
          <div class="message-actions" v-if="!msg.isStreaming">
            <!-- AI 消息显示点赞/点踩 -->
            <template v-if="msg.role === AiRoleEnum.ASSISTANT">
              <el-button
                  text size="small"
                  class="feedback-btn"
                  :class="{ 'feedback-like-active': getFeedback(msg) === CommonEnum.YES }"
                  @click="handleFeedback(msg, 1)"
              >
                <Icon icon="mdi:thumb-up" width="16" />
              </el-button>
              <el-button
                  text size="small"
                  class="feedback-btn"
                  :class="{ 'feedback-dislike-active': getFeedback(msg) === CommonEnum.NO }"
                  @click="handleFeedback(msg, 2)"
              >
                <Icon icon="mdi:thumb-down" width="16" />
              </el-button>
            </template>
            <el-button type="info" text size="small" :icon="CopyDocument" @click="emit('copy', msg)">
              {{ t('aiChat.copyMessage') }}
            </el-button>
            <el-button type="info" text size="small" :icon="Delete" @click="emit('delete', msg)">
              {{ t('aiChat.deleteMessage') }}
            </el-button>
            <el-button
                v-if="showRegenerate(msg, index)"
                type="info" text size="small"
                :icon="RefreshRight"
                :disabled="sending"
                @click="emit('regenerate', msg)"
            >
              {{ t('aiChat.regenerate') }}
            </el-button>
          </div>

          <!-- 流式输出指示器 -->
          <div v-if="msg.isStreaming" class="streaming-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </div>
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
  gap: 24px;
  padding: 24px 0;
  max-width: 768px;
  margin: 0 auto;
}

/* 消息行 */
.message-row {
  display: flex;
  flex-direction: column;
  padding: 0 16px;
}

.message-row.user-row {
  align-items: flex-end;
}

/* 消息体 */
.message-body {
  max-width: 100%;
  min-width: 0;
  position: relative;
}

.user-body {
  max-width: 70%;
}

/* 消息气泡 */
.message-bubble {
  padding: 12px 16px;
  border-radius: 20px;
}

/* 用户消息 - 渐变气泡 */
.user-bubble {
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  color: #fff;
  border-radius: 20px 20px 4px 20px;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
}

/* AI 消息 - 浅色卡片风格 */
.ai-bubble {
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  color: var(--el-text-color-primary);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.message-text {
  font-size: 15px;
  line-height: 1.75;
  word-break: break-word;
}

.user-bubble .message-text {
  white-space: pre-wrap;
}

/* 操作按钮 - ChatGPT 风格 */
.message-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.user-row .message-actions {
  justify-content: flex-end;
}

.message-row:hover .message-actions {
  opacity: 1;
}

.message-actions :deep(.el-button) {
  font-size: 13px;
  padding: 6px 8px;
  height: auto;
  color: var(--el-text-color-secondary);
  border-radius: 6px;
}

.message-actions :deep(.el-button:hover) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.message-actions :deep(.el-button .el-icon) {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  transition: color 0.15s ease;
}

.message-actions :deep(.el-button:hover .el-icon) {
  color: var(--el-text-color-primary);
}

/* 反馈按钮 */
.message-actions :deep(.feedback-btn svg) {
  color: var(--el-text-color-secondary);
  transition: color 0.15s ease;
}

.message-actions :deep(.feedback-btn:hover svg) {
  color: var(--el-text-color-primary);
}

/* 点赞选中 - 蓝色 */
.message-actions :deep(.feedback-like-active),
.message-actions :deep(.feedback-like-active:hover) {
  background: var(--el-color-primary-light-9) !important;
}

.message-actions :deep(.feedback-like-active svg) {
  color: var(--el-color-primary) !important;
}

/* 点踩选中 - 红色 */
.message-actions :deep(.feedback-dislike-active),
.message-actions :deep(.feedback-dislike-active:hover) {
  background: var(--el-color-danger-light-9) !important;
}

.message-actions :deep(.feedback-dislike-active svg) {
  color: var(--el-color-danger) !important;
}

/* 流式输出指示器 */
.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  padding-left: 4px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-text-color-secondary);
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .message-list { gap: 20px; padding: 16px 0; }
  .message-row { padding: 0 12px; }
  .user-body { max-width: 85%; }
  .message-text { font-size: 14px; }
  .message-attachments, .attachment-image { max-width: 200px; }
}

/* 消息附件图片 */
.message-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  max-width: 300px;
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.attachment-image {
  display: block;
  max-width: 300px;
  max-height: 200px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.3s ease, transform 0.2s ease;
  opacity: 0;
}

.attachment-image.image-loaded {
  opacity: 1;
}

.attachment-image:hover {
  transform: scale(1.02);
}
</style>
