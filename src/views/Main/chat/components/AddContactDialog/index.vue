<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
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
const activeTab = ref('user')

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
const adding = ref(false)
const handleAddContact = async (user: any) => {
  adding.value = true
  try {
    await ChatRoomApi.contactAdd({ user_id: user.id })
    ElMessage.success(`已向 ${user.username} 发送好友请求`)
    emit('success')
  } catch (err: any) {
    ElMessage.error(err.message || '添加失败')
  } finally {
    adding.value = false
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
  <el-dialog
    v-model="dialogVisible"
    title="添加联系人"
    :width="isMobile ? '95%' : '800px'"
    :fullscreen="isMobile"
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
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="search-tabs">
      <el-tab-pane label="用户" name="user">
        <!-- 用户列表 -->
        <el-scrollbar height="450px">
          <div v-loading="userLoading" class="user-list">
            <template v-if="filteredUserList.length === 0 && !userLoading">
              <el-empty description="暂无搜索结果" :image-size="80" />
            </template>
            <template v-else>
              <div
                v-for="user in filteredUserList"
                :key="user.id"
                class="user-card"
              >
                <div class="card-left">
                  <el-avatar :size="isMobile ? 50 : 60" :src="user.avatar">
                    {{ user.username?.charAt(0) || '?' }}
                  </el-avatar>
                </div>
                <div class="card-body">
                  <div class="user-name">{{ user.username }}</div>
                  <div class="user-info-row">
                    <span class="info-label">邮箱：</span>
                    <span class="info-value">{{ user.email || '-' }}</span>
                  </div>
                  <div class="user-info-row">
                    <span class="info-label">手机：</span>
                    <span class="info-value">{{ user.phone || '-' }}</span>
                  </div>
                  <div class="user-info-row">
                    <span class="info-label">性别：</span>
                    <span class="info-value">{{ user.sex_show || '-' }}</span>
                  </div>
                  <div class="user-info-row">
                    <span class="info-label">地址：</span>
                    <span class="info-value">{{ user.address_show || '-' }}</span>
                  </div>
                </div>
                <div class="card-right">
                  <el-button
                    v-if="isAdded(user.id)"
                    type="info"
                    disabled
                  >
                    已添加
                  </el-button>
                  <el-button
                    v-else
                    type="primary"
                    :loading="adding"
                    @click="handleAddContact(user)"
                  >
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
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
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

.search-tabs :deep(.el-tabs__content) {
  padding: 0;
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
}

.user-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.pagination {
  margin-top: 16px;
  justify-content: center;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    gap: 8px;
  }

  .search-bar .el-button {
    width: 100%;
  }

  .user-card {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .card-left {
    display: flex;
    justify-content: center;
  }

  .card-body {
    gap: 6px;
  }

  .user-name {
    font-size: 15px;
    text-align: center;
  }

  .user-info-row {
    font-size: 12px;
  }

  .info-label {
    min-width: 45px;
  }

  .card-right {
    justify-content: center;
  }

  .card-right .el-button {
    width: 100%;
  }
}

.add-contact-dialog :deep(.el-dialog__body) {
  padding: 16px 20px;
}
</style>
