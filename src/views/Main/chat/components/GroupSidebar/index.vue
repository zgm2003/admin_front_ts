<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Plus, Close, Switch } from '@element-plus/icons-vue'
import { useChatStore } from '@/store/chat'
import { useUserStore } from '@/store/user'
import { useIsMobile } from '@/hooks/useResponsive'
import { ChatRoomApi, ParticipantRole, type ParticipantItem } from '@/api/chat'
import { UsersListApi } from '@/api/user/users'
import { RemoteSelect } from '@/components/RemoteSelect'

const chatStore = useChatStore()
const userStore = useUserStore()
const isMobile = useIsMobile()

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [val: boolean] }>()

// 群信息
const groupName = ref('')
const announcement = ref('')
const members = ref<ParticipantItem[]>([])
const loading = ref(false)

// 编辑对话框
const showEditDialog = ref(false)
const editForm = ref({ name: '', announcement: '' })

// 邀请对话框
const showInviteDialog = ref(false)
const inviteUserIds = ref<number[]>([])

const conversation = computed(() => chatStore.currentConversation)
const currentUserId = computed(() => Number(userStore.user_id))
const isOwner = computed(() => conversation.value?.owner_id === currentUserId.value)

/** 加载群信息 */
async function loadGroupInfo() {
  if (!conversation.value) return
  loading.value = true
  try {
    const data: any = await ChatRoomApi.groupInfo({ conversation_id: conversation.value.id })
    groupName.value = data.conversation?.name || ''
    announcement.value = data.conversation?.announcement || ''
    members.value = data.participants || []
  } catch {
    ElMessage.error('加载群信息失败')
  } finally {
    loading.value = false
  }
}

// 打开时加载
watch(() => props.visible, (val) => {
  if (val) loadGroupInfo()
})

// WebSocket 群更新时自动刷新（面板打开状态下）
watch(() => chatStore.groupInfoVersion, () => {
  if (props.visible) loadGroupInfo()
})

/** 打开编辑对话框 */
function openEditDialog() {
  editForm.value = { name: groupName.value, announcement: announcement.value }
  showEditDialog.value = true
}

/** 保存群设置 */
async function handleSaveEdit() {
  if (!conversation.value) return
  try {
    await ChatRoomApi.groupUpdate({
      conversation_id: conversation.value.id,
      name: editForm.value.name || undefined,
      announcement: editForm.value.announcement || undefined,
    })
    ElMessage.success('群设置已更新')
    showEditDialog.value = false
    await loadGroupInfo()
    chatStore.loadConversations()
  } catch {
    ElMessage.error('更新失败')
  }
}

/** 邀请成员 */
async function handleInvite() {
  if (!conversation.value || inviteUserIds.value.length === 0) return
  try {
    await ChatRoomApi.groupInvite({ conversation_id: conversation.value.id, user_ids: inviteUserIds.value })
    ElMessage.success('邀请成功')
    showInviteDialog.value = false
    inviteUserIds.value = []
    await loadGroupInfo()
  } catch {
    ElMessage.error('邀请失败')
  }
}

/** 移除成员 */
async function handleKick(member: ParticipantItem) {
  if (!conversation.value) return
  await ElMessageBox.confirm(`确定将 ${member.username} 移出群聊？`, '移除成员', { type: 'warning' })
  try {
    await ChatRoomApi.groupKick({ conversation_id: conversation.value.id, user_id: member.user_id })
    ElMessage.success('已移除')
    await loadGroupInfo()
  } catch {
    ElMessage.error('移除失败')
  }
}

/** 退出群聊 */
async function handleLeave() {
  if (!conversation.value) return
  await ElMessageBox.confirm('确定退出该群聊？退出后将不再接收群消息。', '退出群聊', { type: 'warning' })
  try {
    await ChatRoomApi.groupLeave({ conversation_id: conversation.value.id })
    ElMessage.success('已退出群聊')
    emit('update:visible', false)
    chatStore.loadConversations()
    chatStore.currentConversation = null
  } catch {
    ElMessage.error('退出失败')
  }
}

/** 转让群主 */
async function handleTransfer(member: ParticipantItem) {
  if (!conversation.value) return
  await ElMessageBox.confirm(`确定将群主转让给 ${member.username}？转让后你将变为普通成员。`, '转让群主', { type: 'warning' })
  try {
    await ChatRoomApi.groupTransfer({ conversation_id: conversation.value.id, user_id: member.user_id })
    ElMessage.success('群主已转让')
    await loadGroupInfo()
    chatStore.loadConversations()
  } catch {
    ElMessage.error('转让失败')
  }
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    direction="rtl"
    :size="isMobile ? '85%' : '320px'"
    :with-header="false"
    :append-to-body="true"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="group-sidebar" v-loading="loading">
      <!-- 群信息头部 -->
      <div class="sidebar-header">
        <span class="sidebar-title">群聊信息</span>
        <el-button v-if="isOwner" text size="small" @click="openEditDialog">
          <el-icon><Edit /></el-icon>
        </el-button>
      </div>

      <!-- 群名称 & 公告 -->
      <div class="group-meta">
        <div class="meta-row">
          <span class="meta-label">群名称</span>
          <span class="meta-value">{{ groupName || '未命名群聊' }}</span>
        </div>
        <div v-if="announcement" class="meta-row">
          <span class="meta-label">群公告</span>
          <span class="meta-value announcement">{{ announcement }}</span>
        </div>
      </div>

      <!-- 成员列表 -->
      <div class="member-section">
        <div class="section-header">
          <span>成员（{{ members.length }}）</span>
          <el-button v-if="isOwner" text size="small" @click="showInviteDialog = true">
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>

        <el-scrollbar class="member-scrollbar">
          <div v-for="m in members" :key="m.user_id" class="member-item">
            <div class="member-left">
              <div class="avatar-wrap">
                <el-avatar :size="32" :src="m.avatar || undefined">{{ (m.username || '?')[0] }}</el-avatar>
                <span class="online-dot" :class="{ online: m.is_online }"></span>
              </div>
              <span class="member-name">{{ m.username }}</span>
              <el-tag v-if="m.role === ParticipantRole.Owner" size="small" type="warning" class="role-tag">群主</el-tag>
            </div>
            <div v-if="isOwner && m.user_id !== currentUserId" class="member-actions">
              <el-tooltip content="转让群主">
                <el-button text size="small" @click="handleTransfer(m)">
                  <el-icon :size="14"><Switch /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="移除">
                <el-button text size="small" type="danger" @click="handleKick(m)">
                  <el-icon :size="14"><Close /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- 底部操作 -->
      <div v-if="!isOwner" class="sidebar-footer">
        <el-button type="danger" plain @click="handleLeave" style="width: 100%">退出群聊</el-button>
      </div>
    </div>

    <!-- 编辑群设置对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑群设置" :width="isMobile ? '90%' : '400px'" append-to-body>
      <el-form label-width="70px">
        <el-form-item label="群名称">
          <el-input v-model="editForm.name" maxlength="50" placeholder="请输入群名称" />
        </el-form-item>
        <el-form-item label="群公告">
          <el-input v-model="editForm.announcement" type="textarea" :rows="3" maxlength="500" placeholder="请输入群公告" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 邀请成员对话框 -->
    <el-dialog v-model="showInviteDialog" title="邀请成员" :width="isMobile ? '90%' : '400px'" append-to-body>
      <RemoteSelect
        v-model="inviteUserIds"
        :fetch-method="UsersListApi.list"
        :label-field="(item: any) => `${item.username} (${item.email})`"
        value-field="id"
        placeholder="搜索并选择用户"
        multiple
        style="width: 100%"
      />
      <template #footer>
        <el-button @click="showInviteDialog = false">取消</el-button>
        <el-button type="primary" :disabled="inviteUserIds.length === 0" @click="handleInvite">邀请</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<style scoped>
.group-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.group-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 16px;
}

.meta-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.meta-value {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.meta-value.announcement {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.member-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.member-scrollbar {
  flex: 1;
}

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
}

.member-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.online-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
  border: 1.5px solid var(--el-bg-color);
}

.online-dot.online {
  background: var(--el-color-success);
}

.member-name {
  font-size: 13px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-tag {
  flex-shrink: 0;
}

.member-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.sidebar-footer {
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}
</style>
