<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Check, Close } from '@element-plus/icons-vue'
import { useChatStore } from '@/store/chat'
import { ChatRoomApi, ContactStatus, CommonYesNo, type ContactItem } from '@/api/chat'
import AddContactDialog from '../AddContactDialog/index.vue'

const emit = defineEmits<{
  select: [contact: ContactItem]
}>()

const chatStore = useChatStore()

const loading = ref(false)
const showAddDialog = ref(false)

const pendingContacts = computed(() =>
  chatStore.contacts.filter(c => c.status === ContactStatus.Pending && c.is_initiator === CommonYesNo.No)
)

const sentContacts = computed(() =>
  chatStore.contacts.filter(c => c.status === ContactStatus.Pending && c.is_initiator === CommonYesNo.Yes)
)

const confirmedContacts = computed(() =>
  chatStore.contacts.filter(c => c.status === ContactStatus.Confirmed)
)

/** 加载联系人 */
async function loadAll() {
  loading.value = true
  try {
    await chatStore.loadContacts()
  } catch {
    ElMessage.error('加载联系人失败')
  } finally {
    loading.value = false
  }
}


/** 添加成功回调 */
async function handleAddSuccess() {
  await loadAll()
}

/** 确认联系人请求 */
async function handleConfirm(contact: ContactItem) {
  try {
    await ChatRoomApi.contactConfirm({ user_id: contact.contact_user_id })
    ElMessage.success('已确认')
    await loadAll()
  } catch {
    ElMessage.error('确认失败')
  }
}

/** 拒绝联系人请求 */
async function handleReject(contact: ContactItem) {
  await ElMessageBox.confirm(`确定拒绝 ${contact.username} 的好友请求？`, '拒绝请求', { type: 'warning' })
  try {
    await ChatRoomApi.contactDelete({ user_id: contact.contact_user_id })
    ElMessage.success('已拒绝')
    await loadAll()
  } catch {
    ElMessage.error('操作失败')
  }
}

/** 删除联系人 */
async function handleDelete(contact: ContactItem) {
  await ElMessageBox.confirm(`确定删除联系人 ${contact.username}？`, '删除联系人', { type: 'warning' })
  try {
    await ChatRoomApi.contactDelete({ user_id: contact.contact_user_id })
    ElMessage.success('已删除')
    await loadAll()
  } catch {
    ElMessage.error('删除失败')
  }
}

/** 外部调用：首次激活时加载 */
let loaded = false
async function activate() {
  if (loaded) return
  loaded = true
  await loadAll()
}

/** 点击联系人 → 选中展示资料卡 */
function handleSelect(contact: ContactItem) {
  emit('select', contact)
}

defineExpose({ activate })
</script>

<template>
  <div class="contact-list-wrap" v-loading="loading">
    <!-- 头部 -->
    <div class="contact-header">
      <span class="contact-title">联系人</span>
      <el-button text size="small" @click="showAddDialog = true">
        <el-icon :size="18"><Plus /></el-icon>
      </el-button>
    </div>

    <el-scrollbar class="contact-scrollbar">
      <!-- 收到的好友请求（别人加我的） -->
      <template v-if="pendingContacts.length > 0">
        <div class="section-label">待确认请求</div>
        <div v-for="c in pendingContacts" :key="c.id" class="contact-item pending">
          <div class="contact-left">
            <el-avatar :size="36" :src="c.avatar || undefined">{{ (c.username || '?')[0] }}</el-avatar>
            <span class="contact-name">{{ c.username }}</span>
          </div>
          <div class="contact-actions">
            <el-button text size="small" type="success" @click="handleConfirm(c)">
              <el-icon :size="16"><Check /></el-icon>
            </el-button>
            <el-button text size="small" type="danger" @click="handleReject(c)">
              <el-icon :size="16"><Close /></el-icon>
            </el-button>
          </div>
        </div>
      </template>

      <!-- 我发出的请求（等待对方确认） -->
      <template v-if="sentContacts.length > 0">
        <div class="section-label">已发送请求</div>
        <div v-for="c in sentContacts" :key="c.id" class="contact-item pending">
          <div class="contact-left">
            <el-avatar :size="36" :src="c.avatar || undefined">{{ (c.username || '?')[0] }}</el-avatar>
            <span class="contact-name">{{ c.username }}</span>
          </div>
          <span class="sent-label">等待确认</span>
        </div>
      </template>

      <!-- 已确认联系人 -->
      <div class="section-label">联系人（{{ confirmedContacts.length }}）</div>
      <template v-if="confirmedContacts.length === 0">
        <div class="empty-tip">暂无联系人</div>
      </template>
      <div
        v-for="c in confirmedContacts"
        :key="c.id"
        class="contact-item"
        @click="handleSelect(c)"
      >
        <div class="contact-left">
          <div class="avatar-wrap">
            <el-avatar :size="36" :src="c.avatar || undefined">{{ (c.username || '?')[0] }}</el-avatar>
            <span class="online-dot" :class="{ online: c.is_online || chatStore.onlineUsers.has(c.contact_user_id) }"></span>
          </div>
          <span class="contact-name">{{ c.username }}</span>
        </div>
        <el-button text size="small" type="danger" @click.stop="handleDelete(c)">
          <el-icon :size="14"><Delete /></el-icon>
        </el-button>
      </div>
    </el-scrollbar>

    <!-- 添加联系人对话框 -->
    <AddContactDialog v-model:visible="showAddDialog" @success="handleAddSuccess" />
  </div>
</template>

<style scoped>
.contact-list-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.contact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.contact-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.contact-scrollbar {
  flex: 1;
}

.section-label {
  padding: 8px 16px 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.contact-item:hover {
  background: var(--el-fill-color-light);
}

.contact-item.pending {
  cursor: default;
  background: var(--el-fill-color-extra-light);
}

.contact-left {
  display: flex;
  align-items: center;
  gap: 10px;
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

.contact-name {
  font-size: 14px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.empty-tip {
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

.sent-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}
</style>
