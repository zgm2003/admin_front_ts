<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChatLineRound, Plus, User, ChatDotRound, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useChatStore } from '@/store/chat'
import { useIsMobile } from '@/hooks/useResponsive'
import type { ConversationItem, ContactItem } from '@/api/chat'
import { formatDateTime } from '@/utils/date'
import ConversationList from './components/ConversationList/index.vue'
import ChatWindow from './components/ChatWindow/index.vue'
import ContactList from './components/ContactList/index.vue'
import FriendSelector from './components/FriendSelector/index.vue'

const { t } = useI18n()
const chatStore = useChatStore()

// 左侧面板 tab
const asideTab = ref<'chat' | 'contacts'>('chat')

// 选中的联系人（用于右侧资料卡）
const selectedContact = ref<ContactItem | null>(null)

// ContactList 组件引用（lazy 加载）
const contactListRef = ref<InstanceType<typeof ContactList>>()

// 创建群聊对话框
const showGroupDialog = ref(false)
const groupForm = ref({ name: '', user_ids: [] as number[] })

// ========== 响应式：移动端检测（使用项目 hook） ==========
const isMobile = useIsMobile()
// 移动端下：是否显示右侧面板（聊天窗口/资料卡）
const showMainPanel = ref(false)

onMounted(() => {
  chatStore.registerWsListeners()
  chatStore.loadConversations()
  
  // 如果有当前选中的会话，重新加载消息（防止切换路由后消息不同步）
  if (chatStore.currentConversation) {
    chatStore.loadMessages(chatStore.currentConversation.id, 30, true)
  }
})

onUnmounted(() => {
  chatStore.unregisterWsListeners()
})

// lazy：切到联系人 tab 时才加载联系人列表
watch(asideTab, (tab) => {
  if (tab === 'contacts') contactListRef.value?.activate()
})

/** 移动端返回列表 */
function goBackToList() {
  showMainPanel.value = false
  chatStore.currentConversation = null
  selectedContact.value = null
}

/** 选中会话 */
async function handleSelectConversation(conv: ConversationItem) {
  await chatStore.selectConversation(conv)
  if (isMobile.value) showMainPanel.value = true
}

/** 选中联系人 → 显示资料卡 */
function handleSelectContact(contact: ContactItem) {
  selectedContact.value = contact
  if (isMobile.value) showMainPanel.value = true
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
      if (isMobile.value) showMainPanel.value = true
    }
  } catch {
    ElMessage.error(t('chat.startChatFailed'))
  }
}

/** 创建群聊 */
async function handleCreateGroup() {
  // 至少选择1个好友（加上自己就是2人）
  if (!groupForm.value.name || groupForm.value.user_ids.length < 1) return
  await chatStore.createGroupChat(groupForm.value.name, groupForm.value.user_ids)
  showGroupDialog.value = false
  groupForm.value = { name: '', user_ids: [] }
}

/** 打开创建群聊对话框 */
function openCreateGroupDialog() {
  showGroupDialog.value = true
}
</script>

<template>
  <div class="chat-page">
    <div class="chat-container" :class="{ 'is-mobile': isMobile, 'show-main': showMainPanel }">
      <!-- 左侧：会话列表 / 联系人 -->
      <div class="chat-aside">
        <div class="aside-header">
          <div class="aside-tabs">
            <span class="tab-item" :class="{ active: asideTab === 'chat' }" @click="asideTab = 'chat'">{{ t('chat.tabs.chat') }}</span>
            <span class="tab-item" :class="{ active: asideTab === 'contacts' }" @click="asideTab = 'contacts'">{{ t('chat.tabs.contacts') }}</span>
          </div>
          <div v-if="asideTab === 'chat'" class="aside-actions">
            <el-tooltip :content="t('chat.createGroup')" placement="bottom">
              <el-button text size="small" @click="openCreateGroupDialog">
                <el-icon :size="18"><Plus /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
        <ConversationList v-show="asideTab === 'chat'" @select="handleSelectConversation" />
        <ContactList ref="contactListRef" v-show="asideTab === 'contacts'" @select="handleSelectContact" />
      </div>

      <!-- 右侧面板 -->
      <div class="chat-main">
        <!-- 移动端返回按钮 -->
        <div v-if="isMobile && showMainPanel" class="mobile-back" @click="goBackToList">
          <el-icon :size="20"><ArrowLeft /></el-icon>
          <span>{{ t('common.back') }}</span>
        </div>

        <!-- 联系人 tab：资料卡 -->
        <template v-if="asideTab === 'contacts'">
          <div v-if="!selectedContact" class="empty-chat">
            <el-icon :size="64" class="empty-chat-icon"><User /></el-icon>
            <p class="empty-chat-text">{{ t('chat.selectContact') }}</p>
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
              {{ (selectedContact.is_online || chatStore.onlineUsers.has(selectedContact.contact_user_id)) ? t('chat.online') : t('chat.offline') }}
              </span>
            </div>
            <div class="profile-info">
              <span class="profile-info-label">{{ t('chat.addedTime') }}</span>
              <span class="profile-info-value">{{ formatDateTime(selectedContact.created_at, 'YYYY-MM-DD HH:mm') }}</span>
            </div>
            <el-button type="primary" round @click="handleSendMessage">
              <el-icon style="margin-right: 6px"><ChatDotRound /></el-icon>
              {{ t('chat.sendMessage') }}
            </el-button>
          </div>
        </template>

        <!-- 聊天 tab：聊天窗口 -->
        <template v-else>
          <div v-if="!chatStore.currentConversation" class="empty-chat">
            <el-icon :size="64" class="empty-chat-icon"><ChatLineRound /></el-icon>
            <p class="empty-chat-text">{{ t('chat.selectConversation') }}</p>
          </div>
          <ChatWindow v-else />
        </template>
      </div>
    </div>

    <!-- 创建群聊对话框 -->
    <el-dialog v-model="showGroupDialog" :title="t('chat.createGroup')" :width="isMobile ? '90%' : '500px'">
      <el-form label-width="80px">
        <el-form-item :label="t('chat.groupName')">
          <el-input v-model="groupForm.name" :placeholder="t('chat.groupNamePlaceholder')" maxlength="50" />
        </el-form-item>
        <el-form-item :label="t('chat.selectFriends')">
          <FriendSelector
            v-model="groupForm.user_ids"
            multiple
            :placeholder="t('chat.selectFriendsPlaceholder')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showGroupDialog = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button
          type="primary"
          :disabled="!groupForm.name || groupForm.user_ids.length < 1"
          @click="handleCreateGroup"
        >
          {{ t('common.actions.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.chat-page {
  height: 100%;
}

/* ========== 桌面端：左右并排 ========== */
.chat-container {
  display: flex;
  height: 100%;
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

.chat-aside {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  overflow: hidden;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* ========== 移动端：左右切换 ========== */
.chat-container.is-mobile {
  position: relative;
}

.chat-container.is-mobile .chat-aside {
  width: 100%;
  border-right: none;
}

.chat-container.is-mobile .chat-main {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: var(--el-bg-color);
  transform: translateX(100%);
  transition: transform 0.25s ease;
}

.chat-container.is-mobile.show-main .chat-main {
  transform: translateX(0);
}

/* 移动端返回按钮 */
.mobile-back {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-color-primary);
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.mobile-back:active {
  background: var(--el-fill-color-light);
}

/* ========== 通用样式 ========== */
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
  padding: 40px 20px;
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
