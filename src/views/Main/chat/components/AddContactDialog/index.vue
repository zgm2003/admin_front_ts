<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Plus, Check } from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import { useChatStore } from '@/store/chat'
import { UsersListApi } from '@/api/user/users'
import { ChatRoomApi, ContactStatus } from '@/api/chat'

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

// 已确认的好友ID集合
const confirmedContactIds = computed(() => {
  return new Set(
    chatStore.contacts
      .filter(c => c.status === ContactStatus.Confirmed)
      .map(c => c.contact_user_id)
  )
})

// ========== 搜索 ==========
const searchKeyword = ref('')

// ========== 用户列表 ==========
const userLoading = ref(false)
const userList = ref<any[]>([])
const userPage = ref({ current_page: 1, page_size: 10, total: 0 })

// 过滤后的用户列表（排除自己）
const filteredUserList = computed(() => {
  return userList.value.filter(user => user.id !== currentUserId.value)
})

const loadUsers = async () => {
  userLoading.value = true
  try {
    const params: any = {
      current_page: userPage.value.current_page,
      page_size: userPage.value.page_size
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

// ========== 判断是否已添加 ==========
const isAdded = (userId: number) => {
  return confirmedContactIds.value.has(userId)
}

// ========== 添加联系人 ==========
const addingUserId = ref<number | null>(null)
const handleAddContact = async (user: any) => {
  addingUserId.value = user.id
  try {
    await ChatRoomApi.contactAdd({ user_id: user.id })
    ElMessage.success(`已向 ${user.username} 发送好友请求`)
    emit('success')
    // 添加成功后刷新列表，显示"已添加"状态
    await loadUsers()
  } catch (err: any) {
    ElMessage.error(err.message || '添加失败')
  } finally {
    addingUserId.value = null
  }
}

// ========== 监听对话框打开 ==========
watch(() => props.visible, (val) => {
  if (val) {
    searchKeyword.value = ''
    userPage.value.current_page = 1
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
        @keyup.enter="handleSearch"
        @clear="handleSearch"
        size="large"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" size="large" @click="handleSearch">搜索</el-button>
    </div>

    <!-- 用户列表 -->
    <el-scrollbar :height="isMobile ? 'auto' : '450px'" :max-height="isMobile ? '60vh' : '450px'">
      <div v-loading="userLoading" class="user-list">
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
            :class="{ 'is-added': isAdded(user.id) }"
          >
            <div class="card-left">
              <el-avatar :size="isMobile ? 50 : 60" :src="user.avatar">
                {{ user.username?.charAt(0) || '?' }}
              </el-avatar>
            </div>
            <div class="card-body">
              <div class="user-name">
                {{ user.username }}
                <el-tag v-if="isAdded(user.id)" type="success" size="small" effect="plain">好友</el-tag>
              </div>
              <div v-if="user.email" class="user-info-row">
                <span class="info-label">邮箱</span>
                <span class="info-value">{{ user.email }}</span>
              </div>
              <div v-if="user.phone" class="user-info-row">
                <span class="info-label">手机</span>
                <span class="info-value">{{ user.phone }}</span>
              </div>
              <div v-if="user.sex_show || user.address_show" class="user-info-row">
                <span class="info-label">{{ user.sex_show ? '性别' : '地址' }}</span>
                <span class="info-value">{{ user.sex_show || user.address_show }}</span>
              </div>
            </div>
            <div class="card-right">
              <el-button
                v-if="isAdded(user.id)"
                type="success"
                plain
                disabled
              >
                <el-icon style="margin-right: 4px"><Check /></el-icon>
                已添加
              </el-button>
              <el-button
                v-else
                type="primary"
                :loading="addingUserId === user.id"
                @click="handleAddContact(user)"
              >
                <el-icon v-if="addingUserId !== user.id" style="margin-right: 4px"><Plus /></el-icon>
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

<style scoped>
.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-bar .el-input {
  flex: 1;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.user-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition: all 0.2s;
  align-items: flex-start;
}

.user-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.user-card.is-added {
  background: var(--el-fill-color-extra-light);
  opacity: 0.85;
}

.user-card.is-added:hover {
  border-color: var(--el-border-color-light);
  box-shadow: none;
  transform: none;
}

.card-left {
  flex-shrink: 0;
}

.card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info-row {
  display: flex;
  align-items: center;
  font-size: 13px;
  line-height: 1.5;
}

.info-label {
  color: var(--el-text-color-secondary);
  min-width: 50px;
  flex-shrink: 0;
}

.info-value {
  color: var(--el-text-color-regular);
  word-break: break-all;
  line-height: 1.4;
}

.card-right {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 4px;
}

.card-right .el-button {
  min-width: 100px;
}

.pagination {
  margin-top: 16px;
  justify-content: center;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .search-bar {
    gap: 8px;
  }

  .user-list {
    gap: 10px;
    padding: 10px;
  }

  .user-card {
    gap: 10px;
    padding: 10px;
  }

  .card-left .el-avatar {
    width: 44px !important;
    height: 44px !important;
  }

  .card-body {
    gap: 3px;
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 2px;
    flex-wrap: wrap;
  }

  .user-name .el-tag {
    font-size: 11px;
    height: 18px;
    line-height: 18px;
    padding: 0 4px;
  }

  .user-info-row {
    font-size: 12px;
    line-height: 1.3;
  }

  .info-label {
    min-width: 36px;
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }

  .info-value {
    font-size: 11px;
    flex: 1;
    word-break: break-all;
  }

  .card-right {
    flex-shrink: 0;
    align-items: flex-start;
    padding-top: 0;
  }

  .card-right .el-button {
    min-width: 72px;
    height: 32px;
    padding: 0 10px;
    font-size: 12px;
  }

  .card-right .el-button .el-icon {
    margin-right: 2px !important;
    font-size: 12px;
  }

  .card-right .el-button.is-disabled {
    min-width: 60px;
  }
}

.add-contact-dialog :deep(.el-dialog__body) {
  padding: 16px 20px;
}
</style>
