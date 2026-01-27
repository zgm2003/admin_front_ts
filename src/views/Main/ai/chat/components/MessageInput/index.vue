<script setup lang="ts">
import {ref, computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {Promotion, Picture, Close, Loading, ChatLineSquare} from '@element-plus/icons-vue'
import {ElNotification} from 'element-plus'
import {getUploadToken, validateFile, uploadFileToCloud, type UploadConfig} from '@/utils/cosUpload'

const {t} = useI18n()

// Types
interface Modalities {
  image?: boolean
  audio?: boolean
  video?: boolean
  file?: boolean
}

interface Attachment {
  type: 'image'
  url: string
  name: string
  size: number
}

interface PendingAttachment {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  url?: string
  error?: string
}

const props = defineProps<{
  sending: boolean
  disabled?: boolean
  modalities?: Modalities
  isStreaming?: boolean
  showHistoryBtn?: boolean
}>()

const emit = defineEmits<{
  send: [content: string, attachments?: Attachment[]]
  stop: []
  openHistory: []
}>()

const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()
const pendingAttachments = ref<PendingAttachment[]>([])
const isDragging = ref(false)

// 最大图片数量
const MAX_IMAGES = 5

// Computed: 是否支持图片上传
const supportsImage = computed(() => {
  return props.modalities?.image === true
})

// Computed: 是否已达到图片上限
const isImageLimitReached = computed(() => {
  return pendingAttachments.value.length >= MAX_IMAGES
})

// 自动调整高度
const adjustHeight = () => {
  const textarea = textareaRef.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
  }
}

// 生成唯一 ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

// 创建图片预览
const createPreview = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.readAsDataURL(file)
  })
}

// 上传单个文件
const uploadFile = async (pending: PendingAttachment) => {
  // 找到数组中的索引以确保响应式更新
  const index = pendingAttachments.value.findIndex(a => a.id === pending.id)
  if (index === -1) return
  
  const item = pendingAttachments.value[index]
  if (!item) return

  item.status = 'uploading'
  item.progress = 0

  let config: UploadConfig | null = null

  try {
    // 获取上传凭证
    config = await getUploadToken({
      folderName: 'ai_chat_images'
    })
  } catch (error: any) {
    // 凭证获取失败 - Requirements 7.4
    item.status = 'error'
    item.error = t('aiChat.tokenError')
    ElNotification.error({message: item.error})
    return
  }

  try {
    // 校验文件 - Requirements 7.2
    validateFile(pending.file, config, 'image')
  } catch (error: any) {
    // 文件校验失败（大小/格式）- 显示 validateFile 抛出的错误
    item.status = 'error'
    item.error = error.message
    ElNotification.error({message: item.error})
    return
  }

  try {
    // 上传文件
    item.progress = 30
    const result = await uploadFileToCloud(pending.file, config)
    
    item.url = result.url
    item.status = 'done'
    item.progress = 100
  } catch (error: any) {
    // 网络错误/上传失败 - Requirements 7.1
    item.status = 'error'
    item.error = t('aiChat.networkError')
    ElNotification.error({message: item.error})
  }
}

// 添加图片文件
const addImageFiles = async (files: FileList | File[]) => {
  // 模型不支持图片时显示提示 - Requirements 7.3
  if (!supportsImage.value) {
    ElNotification.warning({message: t('aiChat.modelNotSupportImage')})
    return
  }

  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
  
  // 检查是否超过最大数量限制
  const currentCount = pendingAttachments.value.length
  const availableSlots = MAX_IMAGES - currentCount
  
  if (availableSlots <= 0) {
    ElNotification.warning({message: t('aiChat.maxImagesReached', {max: MAX_IMAGES})})
    return
  }
  
  // 只取可用数量的图片
  const filesToAdd = imageFiles.slice(0, availableSlots)
  
  if (filesToAdd.length < imageFiles.length) {
    ElNotification.warning({message: t('aiChat.maxImagesReached', {max: MAX_IMAGES})})
  }
  
  for (const file of filesToAdd) {
    const preview = await createPreview(file)
    const pending: PendingAttachment = {
      id: generateId(),
      file,
      preview,
      status: 'pending',
      progress: 0
    }
    pendingAttachments.value.push(pending)
    
    // 立即开始上传
    uploadFile(pending)
  }
}

// 点击上传按钮
const handleUploadClick = () => {
  fileInputRef.value?.click()
}

// 文件选择变化
const handleFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    addImageFiles(input.files)
    input.value = '' // 清空以便重复选择同一文件
  }
}

// 粘贴事件
const handlePaste = (e: ClipboardEvent) => {
  if (!supportsImage.value) return

  const items = e.clipboardData?.items
  if (!items) return

  const imageFiles: File[] = []
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) imageFiles.push(file)
    }
  }

  if (imageFiles.length > 0) {
    e.preventDefault()
    addImageFiles(imageFiles)
  }
}

// 拖拽事件
const handleDragOver = (e: DragEvent) => {
  if (!supportsImage.value) return
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  
  if (!supportsImage.value) return

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    addImageFiles(files)
  }
}

// 删除待上传图片
const removeAttachment = (id: string) => {
  const index = pendingAttachments.value.findIndex(a => a.id === id)
  if (index !== -1) {
    pendingAttachments.value.splice(index, 1)
  }
}

// 发送消息
const handleSend = () => {
  if (props.sending || props.disabled) return
  
  const content = inputText.value.trim()
  const hasContent = content.length > 0
  const hasAttachments = pendingAttachments.value.length > 0
  
  // 检查是否有正在上传的文件
  const uploading = pendingAttachments.value.some(a => a.status === 'uploading')
  if (uploading) {
    ElNotification.warning({message: t('aiChat.waitUpload')})
    return
  }
  
  // 检查是否有上传失败的文件
  const failed = pendingAttachments.value.some(a => a.status === 'error')
  if (failed) {
    ElNotification.warning({message: t('aiChat.uploadHasError')})
    return
  }
  
  if (!hasContent && !hasAttachments) return
  
  // 构建附件列表
  const attachments: Attachment[] = pendingAttachments.value
    .filter(a => a.status === 'done' && a.url)
    .map(a => ({
      type: 'image' as const,
      url: a.url!,
      name: a.file.name,
      size: a.file.size
    }))
  
  emit('send', content, attachments.length > 0 ? attachments : undefined)
}

// 键盘事件：Enter 发送，Shift+Enter 换行
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// 处理输入
const handleInput = (e: Event) => {
  inputText.value = (e.target as HTMLTextAreaElement).value
  adjustHeight()
}

// 暴露清空和聚焦方法
defineExpose({
  clear: () => {
    inputText.value = ''
    pendingAttachments.value = []
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
  },
  focus: () => {
    textareaRef.value?.focus()
  }
})
</script>

<template>
  <div class="input-wrapper">
    <!-- 图片预览区 -->
    <div v-if="pendingAttachments.length > 0" class="attachments-preview">
      <div 
        v-for="attachment in pendingAttachments" 
        :key="attachment.id" 
        class="attachment-item"
        :class="{error: attachment.status === 'error'}"
      >
        <img :src="attachment.preview" :alt="attachment.file.name" class="attachment-thumb" />
        
        <!-- 上传进度遮罩 -->
        <div v-if="attachment.status === 'uploading'" class="attachment-overlay">
          <el-icon class="is-loading" :size="24" color="#fff">
            <Loading />
          </el-icon>
        </div>
        
        <!-- 错误遮罩 -->
        <div v-if="attachment.status === 'error'" class="attachment-overlay error">
          <span class="error-text">{{ attachment.error || t('aiChat.uploadFailed') }}</span>
        </div>
        
        <!-- 删除按钮 -->
        <button class="attachment-remove" @click="removeAttachment(attachment.id)">
          <el-icon :size="14">
            <Close />
          </el-icon>
        </button>
      </div>
    </div>
    
    <div 
      class="input-container" 
      :class="{disabled: disabled, focused: false, dragging: isDragging}"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- 历史会话按钮 -->
      <button
        v-if="showHistoryBtn"
        class="history-button"
        :disabled="disabled"
        @click="emit('openHistory')"
        :title="t('aiChat.historyConversations')"
      >
        <el-icon :size="20">
          <ChatLineSquare />
        </el-icon>
      </button>
      
      <!-- 图片上传按钮 -->
      <button
        v-if="supportsImage"
        class="upload-button"
        :disabled="sending || disabled || isImageLimitReached"
        @click="handleUploadClick"
        :title="isImageLimitReached ? t('aiChat.maxImagesReached', {max: MAX_IMAGES}) : t('aiChat.uploadImage')"
      >
        <el-icon :size="20">
          <Picture />
        </el-icon>
      </button>
      
      <!-- 隐藏的文件输入 -->
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        @change="handleFileChange"
      />
      
      <textarea
        ref="textareaRef"
        :value="inputText"
        @input="handleInput"
        @keydown="handleKeydown"
        @paste="handlePaste"
        :placeholder="disabled ? t('aiChat.selectAgentFirst') : t('aiChat.inputPlaceholder')"
        :disabled="sending || disabled"
        rows="1"
        class="chat-textarea"
      />
      <!-- 停止按钮（流式输出中显示） -->
      <button
        v-if="isStreaming"
        class="stop-button"
        @click="emit('stop')"
      >
        <div class="stop-icon"></div>
      </button>
      <!-- 发送按钮（非流式时显示） -->
      <button
        v-else
        class="send-button"
        :class="{active: (inputText.trim() || pendingAttachments.length > 0) && !sending}"
        :disabled="(!inputText.trim() && pendingAttachments.length === 0) || sending || disabled"
        @click="handleSend"
      >
        <el-icon v-if="!sending" :size="20">
          <Promotion />
        </el-icon>
        <el-icon v-else class="is-loading" :size="20">
          <Promotion />
        </el-icon>
      </button>
    </div>
    <div class="input-hint">
      <span>{{ t('aiChat.inputHint') }}</span>
      <span v-if="supportsImage">{{ t('aiChat.inputHintImage') }}</span>
    </div>
  </div>
</template>

<style scoped>
.input-wrapper {
  padding: 16px 24px 24px;
  background: var(--el-bg-color);
}

/* 附件预览区 */
.attachments-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px;
  background: var(--el-fill-color-lighter);
  border-radius: 12px;
}

.attachment-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.attachment-item.error {
  border-color: var(--el-color-danger);
}

.attachment-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.attachment-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.attachment-overlay.error {
  background: rgba(245, 108, 108, 0.8);
}

.error-text {
  font-size: 10px;
  color: #fff;
  text-align: center;
  padding: 4px;
}

.attachment-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.attachment-item:hover .attachment-remove {
  opacity: 1;
}

.input-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.input-container:focus-within {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.input-container.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-container.dragging {
  border-color: var(--el-color-primary);
  border-style: dashed;
  background: var(--el-color-primary-light-9);
}

.history-button {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.history-button:hover:not(:disabled) {
  background: var(--el-fill-color);
  color: var(--el-color-primary);
}

.history-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.upload-button {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.upload-button:hover:not(:disabled) {
  background: var(--el-fill-color);
  color: var(--el-color-primary);
}

.upload-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.chat-textarea {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  min-height: 24px;
  max-height: 200px;
  font-family: inherit;
}

.chat-textarea::placeholder {
  color: var(--el-text-color-placeholder);
}

.chat-textarea:disabled {
  cursor: not-allowed;
}

.send-button {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: var(--el-fill-color);
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.send-button.active {
  background: var(--el-color-primary);
  color: #fff;
}

.send-button.active:hover {
  background: var(--el-color-primary-dark-2);
}

.send-button:disabled {
  cursor: not-allowed;
}

.stop-button {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: var(--el-color-danger);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.stop-button:hover {
  background: var(--el-color-danger-dark-2);
}

.stop-icon {
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 2px;
}

.input-hint {
  text-align: center;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

@media (max-width: 768px) {
  .input-wrapper { padding: 12px 16px 16px; }
  .input-container { border-radius: 12px; padding: 10px 12px; }
  .input-hint { display: none; }
  .attachment-item { width: 60px; height: 60px; }
}
</style>
