<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useIsMobile } from '@/hooks/useResponsive'
import { UsersListApi } from '@/api/user/users'
import { ChatRoomApi } from '@/api/chat'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  success: []
}>()

const isMobile = useIsMobile()

// ========== 搜索 ==========
const searchKeyword = ref('')
const activeTab = ref('user')

// ========== 用户列表 ==========
const userLoading = ref(false)
const userList = ref<any[]>([])
const userPage = ref({ current_page: 1, page_size: 10, total: 0 })

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
    :width="isMobile ? '95%' : '700px'"
    :fullscreen="isMobile"
    append-to-body
    class="add-contact-dialog"
  >
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户名"
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
        <div v-loading="userLoading" class="user-list">
          <template v-if="userList.length === 0 && !userLoading">
            <el-empty description="暂无搜索结果" :image-size="80" />
          </template>
          <template v-else>
            <div
              v-for="user in userList"
              :key="user.id"
              class="user-item"
            >
              <div class="user-info">
                <el-avatar :size="isMobile ? 40 : 48" :src="user.avatar">
                  {{ user.username?.charAt(0) || '?' }}
                </el-avatar>
                <div class="user-detail">
                  <div class="user-name">{{ user.username }}</div>
                  <div class="user-meta">
                    <el-tag v-if="user.sex_show" size="small" type="info">{{ user.sex_show }}</el-tag>
                    <span v-if="user.address_show" class="user-address">{{ user.address_show }}</span>
                  </div>
                </div>
              </div>
              <el-button
                type="primary"
                size="small"
                :loading="adding"
                @click="handleAddContact(user)"
              >
                添加
              </el-button>
            </div>
          </template>
        </div>

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

.search-tabs {
  min-height: 400px;
}

.search-tabs :deep(.el-tabs__content) {
  padding: 0;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  min-height: 300px;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--el-bg-color);
  transition: background 0.15s;
}

.user-item:hover {
  background: var(--el-fill-color-light);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.user-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.user-address {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

  .user-item {
    padding: 10px 12px;
  }

  .user-name {
    font-size: 14px;
  }

  .user-meta {
    font-size: 11px;
  }
}

.add-contact-dialog :deep(.el-dialog__body) {
  padding: 16px 20px;
}
</style>
