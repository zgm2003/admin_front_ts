<script setup lang="ts">
import { shallowRef, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Plus, Check } from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import { useChatStore } from '@/store/chat'
import { UsersListApi } from '@/api/user/users'
import { ChatRoomApi, CommonYesNo, ContactStatus } from '@/api/chat'
import type { UserListItem, UsersListParams } from '@/types/user'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  success: []
}>()

const isMobile = useIsMobile()
const userStore = useUserStore()
const chatStore = useChatStore()

// 当前用户ID
const currentUserId = computed(() => Number(userStore.user_id))

type ContactAddState = 'none' | 'pending_sent' | 'pending_received' | 'confirmed'

const contactStateMap = computed(() => {
  const map = new Map<number, ContactAddState>()
  for (const contact of chatStore.contacts) {
    if (contact.status === ContactStatus.Confirmed) {
      map.set(contact.contact_user_id, 'confirmed')
      continue
    }
    if (contact.status === ContactStatus.Pending && contact.is_initiator === CommonYesNo.Yes) {
      map.set(contact.contact_user_id, 'pending_sent')
      continue
    }
    if (contact.status === ContactStatus.Pending && contact.is_initiator === CommonYesNo.No) {
      map.set(contact.contact_user_id, 'pending_received')
    }
  }
  return map
})

// ========== 搜索 ==========
const searchKeyword = shallowRef('')

// ========== 用户列表 ==========
const userLoading = shallowRef(false)
const userList = shallowRef<UserListItem[]>([])
const userPage = shallowRef({ current_page: 1, page_size: 10, total: 0 })

// 过滤后的用户列表（排除自己）
const filteredUserList = computed(() => {
  return userList.value.filter(user => user.id !== currentUserId.value)
})

const loadUsers = async () => {
  userLoading.value = true
  try {
    const params: UsersListParams = {
      current_page: userPage.value.current_page,
      page_size: userPage.value.page_size,
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    const data = await UsersListApi.list(params)
    userList.value = data.list || []
    userPage.value.total = data.page?.total || 0
  } catch {
    ElMessage.error('加载用户失败')
  } finally {
    userLoading.value = false
  }
}

// ========== 搜索处理 ==========
const handleSearch = () => {
  userPage.value.current_page = 1
  loadUsers()
}

const handlePageChange = (page: number) => {
  userPage.value.current_page = page
  loadUsers()
}

function getContactAddState(userId: number): ContactAddState {
  return contactStateMap.value.get(userId) ?? 'none'
}

function canAddContact(userId: number): boolean {
  return getContactAddState(userId) === 'none'
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

// ========== 添加联系人 ==========
const addingUserId = shallowRef<number | null>(null)
const handleAddContact = async (user: UserListItem) => {
  addingUserId.value = user.id
  try {
    await ChatRoomApi.contactAdd({ user_id: user.id })
    ElMessage.success(`已向 ${user.username} 发送好友请求`)
    await chatStore.loadContacts()
    emit('success')
    await loadUsers()
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '添加失败'))
  } finally {
    addingUserId.value = null
  }
}

async function handleConfirmContact(user: UserListItem) {
  addingUserId.value = user.id
  try {
    await ChatRoomApi.contactConfirm({ user_id: user.id })
    ElMessage.success('已通过请求')
    await chatStore.loadContacts()
    emit('success')
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '确认失败'))
  } finally {
    addingUserId.value = null
  }
}

// ========== 监听对话框打开 ==========
watch(() => props.visible, (val) => {
  if (val) {
    searchKeyword.value = ''
    userPage.value.current_page = 1
    void chatStore.loadContacts()
    loadUsers()
  }
})

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})
</script>

<template>
  <AppDialog
    v-model="dialogVisible"
    title="添加联系人"
    :width="isMobile ? '95%' : '800px'"
    body-padding="16px 20px"
    append-to-body
    class="add-contact-dialog"
  >
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户名 / 邮箱 / 手机号"
        clearable
        size="large"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button
        type="primary"
        size="large"
        @click="handleSearch"
      >
        搜索
      </el-button>
    </div>

    <!-- 用户列表 -->
    <el-scrollbar
      :height="isMobile ? 'auto' : '450px'"
      :max-height="isMobile ? '60vh' : '450px'"
    >
      <div
        v-loading="userLoading"
        class="user-list"
      >
        <!-- 空状态 -->
        <template v-if="filteredUserList.length === 0 && !userLoading">
          <el-empty 
            :description="searchKeyword ? '未找到匹配的用户' : '请输入关键词搜索'" 
            :image-size="80" 
          />
        </template>

        <!-- 用户列表 -->
        <template v-else>
          <div
            v-for="user in filteredUserList"
            :key="user.id"
            class="user-card"
            :class="{ 'is-added': getContactAddState(user.id) === 'confirmed' }"
          >
            <div class="card-left">
              <el-avatar
                :size="isMobile ? 50 : 60"
                :src="user.avatar ?? undefined"
              >
                {{ user.username?.charAt(0) || '?' }}
              </el-avatar>
            </div>
            <div class="card-body">
              <div class="user-name">
                {{ user.username }}
                <el-tag
                  v-if="getContactAddState(user.id) === 'confirmed'"
                  type="success"
                  size="small"
                  effect="plain"
                >
                  好友
                </el-tag>
                <el-tag
                  v-else-if="getContactAddState(user.id) === 'pending_sent'"
                  type="warning"
                  size="small"
                  effect="plain"
                >
                  已发送
                </el-tag>
                <el-tag
                  v-else-if="getContactAddState(user.id) === 'pending_received'"
                  type="primary"
                  size="small"
                  effect="plain"
                >
                  待通过
                </el-tag>
              </div>
              <div
                v-if="user.email"
                class="user-info-row"
              >
                <span class="info-label">邮箱</span>
                <span class="info-value">{{ user.email }}</span>
              </div>
              <div
                v-if="user.phone"
                class="user-info-row"
              >
                <span class="info-label">手机</span>
                <span class="info-value">{{ user.phone }}</span>
              </div>
              <div
                v-if="user.sex_show || user.address_show"
                class="user-info-row"
              >
                <span class="info-label">{{ user.sex_show ? '性别' : '地址' }}</span>
                <span class="info-value">{{ user.sex_show || user.address_show }}</span>
              </div>
            </div>
            <div class="card-right">
              <el-button
                v-if="getContactAddState(user.id) === 'confirmed'"
                type="success"
                plain
                disabled
              >
                <el-icon style="margin-right: 4px">
                  <Check />
                </el-icon>
                已添加
              </el-button>
              <el-button
                v-else-if="getContactAddState(user.id) === 'pending_sent'"
                type="warning"
                plain
                disabled
              >
                已发送
              </el-button>
              <el-button
                v-else-if="getContactAddState(user.id) === 'pending_received'"
                type="primary"
                :loading="addingUserId === user.id"
                @click="handleConfirmContact(user)"
              >
                通过请求
              </el-button>
              <el-button
                v-else-if="canAddContact(user.id)"
                type="primary"
                :loading="addingUserId === user.id"
                @click="handleAddContact(user)"
              >
                <el-icon
                  v-if="addingUserId !== user.id"
                  style="margin-right: 4px"
                >
                  <Plus />
                </el-icon>
                添加好友
              </el-button>
            </div>
          </div>
        </template>
      </div>
    </el-scrollbar>

    <!-- 分页 -->
    <el-pagination
      v-if="userPage.total > 0"
      v-model:current-page="userPage.current_page"
      :page-size="userPage.page_size"
      :total="userPage.total"
      layout="prev, pager, next"
      :small="isMobile"
      class="pagination"
      @current-change="handlePageChange"
    />
  </AppDialog>
</template>

<style scoped src="./add-contact-dialog.css"></style>
