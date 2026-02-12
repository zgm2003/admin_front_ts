<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ChatLineRound, Plus, User, ChatDotRound } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useChatStore } from '@/store/chat'
import type { ConversationItem, ContactItem } from '@/api/chat'
import { UsersListApi } from '@/api/user/users'
import { RemoteSelect } from '@/components/RemoteSelect'
import ConversationList from './components/ConversationList/index.vue'
import ChatWindow from './components/ChatWindow/index.vue'
import ContactList from './components/ContactList/index.vue'

const chatStore = useChatStore()

// 左侧面板 tab
const asideTab = ref<'chat' | 'contacts'>('chat')

// 选中的联系人（用于右侧资料卡）
const selectedContact = ref<ContactItem | null>(null)

// 创建私聊对话框
const showPrivateDialog = ref(false)
const privateUserId = ref<number>()

// 创建群聊对话框
const showGroupDialog = ref(false)
const groupForm = ref({ name: '', user_ids: [] as number[] })

/** 选中会话 */
async function handleSelectConversation(conv: ConversationItem) {
  await chatStore.selectConversation(conv)
}

/** 选中联系人 → 显示资料卡 */
function handleSelectContact(contact: ContactItem) {
  selectedContact.value = contact
}

/** 资料卡 → 发消息 */
async function handleSendMessage() {
  if (!selectedContact.value) return
  try {
    const conv = await chatStore.createPrivateChat(selectedContact.value.contact_user_id)
    if (conv) {
      await chatStore.selectConversation(conv)
      asideTab.value = 'chat'
      selectedContact.value = null
    }
  } catch {
    ElMessage.error('发起聊天失败')
  }
}

/** 创建私聊 */
async function handleCreatePrivate() {
  if (!privateUserId.value) return
  await chatStore.createPrivateChat(privateUserId.value)
  showPrivateDialog.value = false
  privateUserId.value = undefined
}

/** 创建群聊 */
async function handleCreateGroup() {
  if (!groupForm.value.name || groupForm.value.user_ids.length < 2) return
  await chatStore.createGroupChat(groupForm.value.name, groupForm.value.user_ids)
  showGroupDialog.value = false
  groupForm.value = { name: '', user_ids: [] }
}

// 生命周期：注册 WebSocket 监听，加载会话列表
onMounted(() => {
  chatStore.registerWsListeners()
  chatStore.loadConversations()
})

onUnmounted(() => {
  chatStore.unregisterWsListeners()
})
</script>

<template>
  <div class="chat-page">
    <el-container class="chat-container">
      <!-- 左侧：会话列表 / 联系人 -->
      <el-aside width="320px" class="chat-aside">
        <div class="aside-header">
          <div class="aside-tabs">
            <span class="tab-item" :class="{ active: asideTab === 'chat' }" @click="asideTab = 'chat'">聊天</span>
            <span class="tab-item" :class="{ active: asideTab === 'contacts' }" @click="asideTab = 'contacts'">联系人</span>
          </div>
          <div v-if="asideTab === 'chat'" class="aside-actions">
            <el-tooltip content="发起私聊" placement="bottom">
              <el-button text size="small" @click="showPrivateDialog = true">
                <el-icon :size="18"><User /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="创建群聊" placement="bottom">
              <el-button text size="small" @click="showGroupDialog = true">
                <el-icon :size="18"><Plus /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
        <ConversationList v-show="asideTab === 'chat'" @select="handleSelectConversation" />
        <ContactList v-show="asideTab === 'contacts'" @select="handleSelectContact" />
      </el-aside>

      <!-- 右侧面板 -->
      <el-main class="chat-main">
        <!-- 联系人 tab：资料卡 -->
        <template v-if="asideTab === 'contacts'">
          <div v-if="!selectedContact" class="empty-chat">
            <el-icon :size="64" class="empty-chat-icon"><User /></el-icon>
            <p class="empty-chat-text">选择一个联系人查看资料</p>
          </div>
          <div v-else class="contact-profile-card">
            <el-avatar :size="80" :src="selectedContact.avatar || undefined" class="profile-avatar">
              {{ (selectedContact.username || '?')[0] }}
            </el-avatar>
            <div class="profile-username">{{ selectedContact.username }}</div>
            <div class="profile-status">
              <span
                class="status-dot"
                :class="{ online: selectedContact.is_online || chatStore.onlineUsers.has(selectedContact.contact_user_id) }"
              ></span>
              <span class="status-text">
                {{ (selectedContact.is_online || chatStore.onlineUsers.has(selectedContact.contact_user_id)) ? '在线' : '离线' }}
              </span>
            </div>
            <div class="profile-info">
              <span class="profile-info-label">添加时间</span>
              <span class="profile-info-value">{{ selectedContact.created_at }}</span>
            </div>
            <el-button type="primary" round @click="handleSendMessage">
              <el-icon style="margin-right: 6px"><ChatDotRound /></el-icon>
              发消息
            </el-button>
          </div>
        </template>

        <!-- 聊天 tab：聊天窗口 -->
        <template v-else>
          <div v-if="!chatStore.currentConversation" class="empty-chat">
            <el-icon :size="64" class="empty-chat-icon"><ChatLineRound /></el-icon>
            <p class="empty-chat-text">选择一个会话开始聊天</p>
          </div>
          <ChatWindow v-else />
        </template>
      </el-main>
    </el-container>

    <!-- 创建私聊对话框 -->
    <el-dialog v-model="showPrivateDialog" title="发起私聊" width="400px">
      <el-form>
        <el-form-item label="选择用户">
          <RemoteSelect
            v-model="privateUserId"
            :fetch-method="UsersListApi.list"
            :label-field="(item: any) => `${item.username} (${item.email})`"
            value-field="id"
            placeholder="搜索用户"
            width="100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPrivateDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!privateUserId" @click="handleCreatePrivate">确定</el-button>
      </template>
    </el-dialog>

    <!-- 创建群聊对话框 -->
    <el-dialog v-model="showGroupDialog" title="创建群聊" width="400px">
      <el-form>
        <el-form-item label="群名称">
          <el-input v-model="groupForm.name" placeholder="请输入群名称" maxlength="50" />
        </el-form-item>
        <el-form-item label="选择成员">
          <RemoteSelect
            v-model="groupForm.user_ids"
            :fetch-method="UsersListApi.list"
            :label-field="(item: any) => `${item.username} (${item.email})`"
            value-field="id"
            placeholder="搜索用户"
            multiple
            width="100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showGroupDialog = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!groupForm.name || groupForm.user_ids.length < 2"
          @click="handleCreateGroup"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.chat-page {
  height: 100%;
}

.chat-container {
  height: 100%;
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

.chat-aside {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  overflow: hidden;
}

.aside-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.aside-tabs {
  display: flex;
  gap: 16px;
}

.tab-item {
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  padding-bottom: 2px;
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
}

.tab-item.active {
  color: var(--el-text-color-primary);
  font-weight: 600;
  border-bottom-color: var(--el-color-primary);
}

.tab-item:hover {
  color: var(--el-text-color-primary);
}

.aside-actions {
  display: flex;
  gap: 4px;
}

.chat-main {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.empty-chat-icon {
  color: var(--el-text-color-placeholder);
}

.empty-chat-text {
  font-size: 15px;
  color: var(--el-text-color-secondary);
}

/* 联系人资料卡 */
.contact-profile-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
}

.profile-avatar {
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  font-size: 28px;
  font-weight: 600;
}

.profile-username {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.profile-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
}

.status-dot.online {
  background: var(--el-color-success);
}

.status-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.profile-info {
  display: flex;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.profile-info-label {
  color: var(--el-text-color-placeholder);
}
</style>
