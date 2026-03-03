<script setup lang="ts">
import { ref, nextTick, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { Delete, ChatLineSquare, Download, Monitor } from '@element-plus/icons-vue'
import { GenAiApi } from '@/api/devTools/genAi'
import type { GenAiStreamCallbacks, ConversationItem } from '@/api/devTools/genAi'
import type { ChatMessage, ToolCall, Phase, TemplateItem } from './composables/types'
import ChatSidebar from './components/ChatSidebar/index.vue'
import MessageItem from './components/MessageItem/index.vue'
import InputArea from './components/InputArea/index.vue'

const { t } = useI18n()

// ========== State ==========
const phase = ref<Phase>('idle')
const phaseMsg = ref('')
const sending = ref(false)
const inputContent = ref('')
const conversationId = ref<number | null>(null)
const allowOverwrite = ref(false)
const enableReview = ref(false)
const enableTest = ref(false)
const chatRef = ref<HTMLElement>()

// ========== Sidebar ==========
const sidebarOpen = ref(true)
const conversationList = ref<ConversationItem[]>([])
const loadingConversations = ref(false)

const loadConversations = async () => {
  loadingConversations.value = true
  try {
    const res = await GenAiApi.conversations({ page_size: 50 })
    conversationList.value = (res as any)?.list || []
  } catch {
    conversationList.value = []
  } finally {
    loadingConversations.value = false
  }
}

const switchConversation = async (conv: ConversationItem) => {
  if (sending.value) return
  conversationId.value = conv.id
  messages.value = []
  phase.value = 'idle'

  try {
    const res = await GenAiApi.messages({ conversation_id: conv.id })
    const list = (res as any)?.list || []
    for (const m of list) {
      messages.value.push({
        role: m.role as 'user' | 'assistant',
        content: m.content || '',
      })
    }
    scrollToBottom()
  } catch {
    ElMessage.error(t('aiCodeGen.notify.requestFail'))
  }
}

const deleteConversation = async (conv: ConversationItem) => {
  try {
    await ElMessageBox.confirm(t('aiCodeGen.history.deleteConfirm'), { type: 'warning' })
  } catch {
    return
  }
  try {
    await GenAiApi.deleteConversation({ id: conv.id })
    conversationList.value = conversationList.value.filter(c => c.id !== conv.id)
    if (conversationId.value === conv.id) {
      handleClear()
    }
  } catch {
    ElMessage.error(t('aiCodeGen.notify.requestFail'))
  }
}

const startNewChat = () => {
  handleClear()
}

onMounted(() => {
  loadConversations()
})

const messages = ref<ChatMessage[]>([])

// ========== Diff viewer ==========
const expandedDiffs = ref<Record<string, boolean>>({})
const toggleDiff = (msgIdx: number, fileIdx: number) => {
  const key = `${msgIdx}-${fileIdx}`
  expandedDiffs.value[key] = !expandedDiffs.value[key]
}

// ========== Scroll ==========
const scrollToBottom = () => {
  nextTick(() => {
    if (chatRef.value) {
      chatRef.value.scrollTop = chatRef.value.scrollHeight
    }
  })
}

// ========== Phase display ==========
const phaseLabel = computed(() => {
  switch (phase.value) {
    case 'researching': return t('aiCodeGen.phase.researching')
    case 'generating': return t('aiCodeGen.phase.generating')
    case 'reviewing': return t('aiCodeGen.phase.reviewing')
    case 'testing': return t('aiCodeGen.phase.testing')
    case 'done': return t('aiCodeGen.phase.done')
    default: return ''
  }
})

const phaseType = computed(() => {
  switch (phase.value) {
    case 'researching': return 'warning'
    case 'generating': return 'primary'
    case 'reviewing': return 'info'
    case 'testing': return 'info'
    case 'done': return 'success'
    default: return 'info'
  }
})

// ========== Send ==========
const handleSend = async () => {
  const content = inputContent.value.trim()
  if (!content || sending.value) return

  sending.value = true
  phase.value = 'idle'
  phaseMsg.value = ''
  inputContent.value = ''

  // Add user message
  messages.value.push({ role: 'user', content })

  // Add AI placeholder — must reference the reactive proxy from the array, not the plain object
  messages.value.push({ role: 'assistant', content: '', tool_calls: [], tables: [], files: [], isStreaming: true })
  const aiMsg = messages.value[messages.value.length - 1]!
  scrollToBottom()

  const callbacks: GenAiStreamCallbacks = {
    onPhase: (p, msg) => {
      phase.value = p as any
      phaseMsg.value = msg
    },
    onContent: (delta) => {
      aiMsg.content += delta
      scrollToBottom()
    },
    onConversation: (id) => {
      conversationId.value = id
    },
    onToolCall: (data) => {
      if (!aiMsg.tool_calls) aiMsg.tool_calls = []
      aiMsg.tool_calls.push({
        call_id: data.call_id,
        tool_name: data.tool_name,
        tool_inputs: data.tool_inputs,
        status: 'calling',
        collapsed: true,
      })
      scrollToBottom()
    },
    onToolResult: (data) => {
      const tc = aiMsg.tool_calls?.find(t => t.call_id === data.call_id)
      if (tc) {
        tc.tool_result = data.tool_result
        tc.status = 'done'
      }
    },
    onTableCreated: (data) => {
      if (!aiMsg.tables) aiMsg.tables = []
      aiMsg.tables.push(data)
      if (data.success) {
        ElMessage.success(t('aiCodeGen.notify.tableSuccess', { name: data.table_name }))
      } else {
        ElMessage.error(t('aiCodeGen.notify.tableFail', { name: data.table_name, error: data.error }))
      }
    },
    onTableAltered: (data) => {
      if (!aiMsg.tables) aiMsg.tables = []
      aiMsg.tables.push({ ...data, altered: true })
      if (data.success) {
        ElMessage.success(t('aiCodeGen.notify.tableAlterSuccess', { name: data.table_name }))
      } else {
        ElMessage.error(t('aiCodeGen.notify.tableAlterFail', { name: data.table_name, error: data.error }))
      }
    },
    onFileWritten: (data) => {
      if (!aiMsg.files) aiMsg.files = []
      aiMsg.files.push(data)
      if (data.success) {
        ElMessage.success(t('aiCodeGen.notify.fileSuccess', { path: data.path }))
      } else {
        ElMessage.warning(t('aiCodeGen.notify.fileFail', { path: data.path, error: data.error }))
      }
    },
    onReview: (delta) => {
      aiMsg.reviewContent = (aiMsg.reviewContent || '') + delta
      scrollToBottom()
    },
    onTest: (delta) => {
      aiMsg.testContent = (aiMsg.testContent || '') + delta
      scrollToBottom()
    },
    onDone: (data) => {
      phase.value = 'done'
      aiMsg.isStreaming = false
      sending.value = false
      if (data.conversation_id) conversationId.value = data.conversation_id
      scrollToBottom()
      loadConversations()
    },
    onError: (msg) => {
      phase.value = 'idle'
      aiMsg.isStreaming = false
      sending.value = false
      // Remove empty AI message
      if (!aiMsg.content && !aiMsg.tool_calls?.length) {
        messages.value.pop()
      }
      ElNotification.error({ message: msg })
    },
  }

  try {
    await GenAiApi.stream({
      content,
      conversation_id: conversationId.value || undefined,
      allow_overwrite: allowOverwrite.value || undefined,
      enable_review: enableReview.value || undefined,
      enable_test: enableTest.value || undefined,
    }, callbacks)
  } catch (error: any) {
    phase.value = 'idle'
    aiMsg.isStreaming = false
    sending.value = false
    if (!aiMsg.content && !aiMsg.tool_calls?.length) {
      messages.value.pop()
    }
    ElNotification.error({ message: error.message || t('aiCodeGen.notify.requestFail') })
  }
}

// ========== Clear ==========
const handleClear = () => {
  messages.value = []
  conversationId.value = null
  phase.value = 'idle'
  phaseMsg.value = ''
}

// ========== Tool call toggle ==========
const toggleToolCall = (tc: ToolCall) => {
  tc.collapsed = !tc.collapsed
}

// ========== Templates ==========
const templates = computed<TemplateItem[]>(() => [
  { key: 'crud', icon: 'C', label: t('aiCodeGen.template.crud'), prompt: t('aiCodeGen.template.crudPrompt') },
  { key: 'tree', icon: 'T', label: t('aiCodeGen.template.tree'), prompt: t('aiCodeGen.template.treePrompt') },
  { key: 'config', icon: 'S', label: t('aiCodeGen.template.config'), prompt: t('aiCodeGen.template.configPrompt') },
  { key: 'log', icon: 'L', label: t('aiCodeGen.template.log'), prompt: t('aiCodeGen.template.logPrompt') },
  { key: 'stat', icon: 'R', label: t('aiCodeGen.template.stat'), prompt: t('aiCodeGen.template.statPrompt') },
])

// ========== Export ==========
const exportConversation = () => {
  if (messages.value.length === 0) return
  const parts: string[] = ['# AI Code Generation\n']
  for (const msg of messages.value) {
    const label = msg.role === 'user' ? '## User' : '## Assistant'
    parts.push(`${label}\n\n${msg.content}`)
    if (msg.reviewContent) {
      parts.push(`\n### ${t('aiCodeGen.reviewTitle')}\n\n${msg.reviewContent}`)
    }
    if (msg.testContent) {
      parts.push(`\n### ${t('aiCodeGen.testTitle')}\n\n${msg.testContent}`)
    }
  }
  const md = parts.join('\n\n---\n\n')
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `codegen-${conversationId.value || Date.now()}.md`
  a.click()
  URL.revokeObjectURL(url)
}

// ========== Tool name display ==========
const toolDisplayName = (name: string) => {
  const map: Record<string, string> = {
    codegen_list_tables: t('aiCodeGen.tool.listTables'),
    codegen_get_columns: t('aiCodeGen.tool.getColumns'),
    codegen_alter_table: t('aiCodeGen.tool.alterTable'),
    codegen_read_convention: t('aiCodeGen.tool.readConvention'),
    codegen_read_example: t('aiCodeGen.tool.readExample'),
    codegen_list_files: t('aiCodeGen.tool.listFiles'),
  }
  return map[name] || name
}
</script>

<template>
  <div class="gen-ai-wrapper">
    <!-- Sidebar -->
    <ChatSidebar
      v-if="sidebarOpen"
      :conversation-list="conversationList"
      :loading="loadingConversations"
      :active-id="conversationId"
      :disabled="sending"
      @switch="switchConversation"
      @delete="deleteConversation"
      @new-chat="startNewChat"
    />

    <!-- Main content -->
    <div class="gen-ai-main">
      <!-- Header -->
      <div class="gen-ai-hd">
        <div class="hd-left">
          <el-button text @click="sidebarOpen = !sidebarOpen" class="sidebar-toggle">
            <el-icon><ChatLineSquare /></el-icon>
          </el-button>
          <h2 class="hd-title">{{ t('aiCodeGen.title') }}</h2>
          <el-tag v-if="phase !== 'idle'" :type="phaseType" effect="dark" round size="small">
            {{ phaseLabel }}
          </el-tag>
        </div>
        <div class="hd-right">
          <el-checkbox v-model="allowOverwrite" :label="t('aiCodeGen.allowOverwrite')" />
          <el-checkbox v-model="enableReview" :label="t('aiCodeGen.enableReview')" />
          <el-checkbox v-model="enableTest" :label="t('aiCodeGen.enableTest')" />
          <el-button :icon="Download" @click="exportConversation" :disabled="messages.length === 0">
            {{ t('aiCodeGen.export') }}
          </el-button>
          <el-button :icon="Delete" @click="handleClear" :disabled="sending">
            {{ t('aiCodeGen.newChat') }}
          </el-button>
        </div>
      </div>

      <!-- Chat area -->
      <div ref="chatRef" class="chat-area">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">
            <el-icon :size="48" color="var(--el-color-primary-light-3)"><Monitor /></el-icon>
          </div>
          <h3>{{ t('aiCodeGen.emptyTitle') }}</h3>
          <p>{{ t('aiCodeGen.emptyDesc') }}</p>
          <div class="example-prompts">
            <div class="example-item" @click="inputContent = t('aiCodeGen.example.articleFull')">
              {{ t('aiCodeGen.example.article') }}
            </div>
            <div class="example-item" @click="inputContent = t('aiCodeGen.example.announcementFull')">
              {{ t('aiCodeGen.example.announcement') }}
            </div>
            <div class="example-item" @click="inputContent = t('aiCodeGen.example.feedbackFull')">
              {{ t('aiCodeGen.example.feedback') }}
            </div>
          </div>
        </div>

        <MessageItem
          v-for="(msg, idx) in messages"
          :key="idx"
          :msg="msg"
          :msg-idx="idx"
          :expanded-diffs="expandedDiffs"
          :tool-display-name="toolDisplayName"
          @toggle-tool-call="toggleToolCall"
          @toggle-diff="toggleDiff"
        />
      </div>

      <!-- Input area -->
      <InputArea
        v-model="inputContent"
        :sending="sending"
        :templates="templates"
        @send="handleSend"
      />
    </div>
  </div>
</template>

<style scoped>
/* ========== Layout ========== */
.gen-ai-wrapper {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.gen-ai-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  height: 100%;
  background: var(--el-bg-color);
}

/* ========== Header ========== */
.gen-ai-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-wrap: wrap;
  gap: 8px;
}

.hd-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar-toggle {
  margin-right: 2px;
}

.hd-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.hd-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ========== Chat area ========== */
.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  scroll-behavior: smooth;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.empty-state p {
  max-width: 480px;
  line-height: 1.6;
  margin-bottom: 24px;
  font-size: 14px;
}

.example-prompts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 480px;
}

.example-item {
  padding: 10px 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.example-item:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .gen-ai-hd {
    padding: 8px 12px;
  }
  .hd-title {
    font-size: 15px;
  }
  .chat-area {
    padding: 12px;
  }
  .example-prompts {
    max-width: 100%;
  }
}
</style>
