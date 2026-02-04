<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { UsersQuickEntryApi } from '@/api/user/usersQuickEntry'
import { ElMessage } from 'element-plus'
import { Setting, ArrowRight, TrendCharts, User, Document, Clock, Plus } from '@element-plus/icons-vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import draggable from 'vuedraggable'

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()
const isMobile = useIsMobile()

// 统计数据
const stats = ref([
  { label: '总用户数', value: 0, icon: User, color: '#409EFF', trend: '+12%' },
  { label: '今日访问', value: 0, icon: TrendCharts, color: '#67C23A', trend: '+8%' },
  { label: '系统日志', value: 0, icon: Document, color: '#E6A23C', trend: '+5%' },
  { label: '在线用户', value: 0, icon: Clock, color: '#F56C6C', trend: '+3%' },
])

// 快捷入口设置
const isEditMode = ref(false)
const addSelectVisible = ref(false)
const selectedPermissionId = ref<string>('')
const entryColors = ['#409EFF', '#059669', '#D97706', '#DC2626']

// 从 permissions 中提取 type=2 的菜单（可选项）
const menuOptions = computed(() => {
  const result: any[] = []
  const existingIds = new Set(userStore.quickEntry.map(e => e.permission_id))
  const traverse = (items: any[], parentLabel?: string) => {
    items.forEach(item => {
      // 只选有 path 的菜单，且未添加过
      if (item.path && !existingIds.has(Number(item.index))) {
        result.push({
          value: item.index,
          label: parentLabel ? `${parentLabel} / ${item.label}` : item.label,
        })
      }
      if (item.children?.length) {
        traverse(item.children, item.label)
      }
    })
  }
  traverse(userStore.permissions)
  return result
})

// 快捷入口（根据 quickEntry 与 permissions 做交集）
const entries = computed(() => {
  return userStore.quickEntry
    .map((entry, index) => {
      const menu = userStore.permissionMap.get(String(entry.permission_id))
      if (!menu || !menu.path) return null
      return {
        id: entry.id,
        permissionId: entry.permission_id,
        label: t(menu.i18n_key) || menu.label,
        icon: menu.icon || 'Document',
        path: menu.path,
        color: entryColors[index % 4],
        bg: entryColors[index % 4] + '15',
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
})

// 切换编辑模式
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
}

// 新增快捷入口
const handleAdd = async () => {
  if (!selectedPermissionId.value) return
  try {
    const res = await UsersQuickEntryApi.add({ permission_id: Number(selectedPermissionId.value) })
    userStore.quickEntry.push({ id: res.id, permission_id: Number(selectedPermissionId.value) })
    selectedPermissionId.value = ''
    addSelectVisible.value = false
    ElMessage.success(t('common.success'))
  } catch (e: any) {
    ElMessage.error(e.message || t('common.fail'))
  }
}

// 删除快捷入口
const handleDelete = async (entry: typeof entries.value[0]) => {
  try {
    await UsersQuickEntryApi.del({ id: entry.id })
    const idx = userStore.quickEntry.findIndex(e => e.id === entry.id)
    if (idx > -1) userStore.quickEntry.splice(idx, 1)
    ElMessage.success(t('common.success'))
  } catch (e: any) {
    ElMessage.error(e.message || t('common.fail'))
  }
}

// 拖拽排序结束
const onDragEnd = async () => {
  const items = userStore.quickEntry.map((e, idx) => ({ id: e.id, sort: idx + 1 }))
  try {
    await UsersQuickEntryApi.sort({ items })
  } catch (e: any) {
    ElMessage.error(e.message || t('common.fail'))
  }
}

// 动态获取图标组件（支持所有 Element Plus 图标）
const getIconComponent = (iconName: string) => {
  return (ElementPlusIconsVue as any)[iconName] || Document
}

// 最近活动（模拟数据）
const activities = ref([
  { user: '张三!', action: '创建了新用户', time: '2 分钟前', type: 'success' as const },
  { user: '李四', action: '修改了角色权限', time: '15 分钟前', type: 'warning' as const },
  { user: '王五', action: '删除了系统日志', time: '1 小时前', type: 'danger' as const },
  { user: '赵六', action: '登录了系统', time: '2 小时前', type: 'info' as const },
])

const goTo = (path: string) => router.push(path)
const goToPersonal = () => router.push({ path: '/personal', query: { user_id: userStore.user_id } })

// 模拟加载数据
onMounted(() => {
  setTimeout(() => {
    if (stats.value[0]) stats.value[0].value = 1248
    if (stats.value[1]) stats.value[1].value = 856
    if (stats.value[2]) stats.value[2].value = 3421
    if (stats.value[3]) stats.value[3].value = 42
  }, 300)
})
</script>

<template>
  <div class="home-page">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <el-avatar :src="userStore.avatar" :size="64" class="welcome-avatar" />
        <div class="welcome-text">
          <h2 class="welcome-title">{{ t('common.welcomeBack') }}，{{ userStore.username }}</h2>
          <p class="welcome-subtitle">{{ new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
        </div>
      </div>
      <el-button type="primary" size="large" @click="goToPersonal">
        <el-icon><Setting /></el-icon>
        <span>{{ t('menu.personal') }}</span>
      </el-button>
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <div class="stat-icon" :style="{ backgroundColor: stat.color + '15', color: stat.color }">
          <el-icon :size="28"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">{{ stat.label }}</div>
          <el-statistic 
            :value="stat.value" 
            :precision="0"
            class="stat-value"
          />
          <div class="stat-trend" :class="{ positive: stat.trend.startsWith('+') }">
            {{ stat.trend }}
          </div>
        </div>
      </div>
    </div>

    <el-row :gutter="24">
      <!-- 快捷入口 -->
      <el-col :xs="24" :lg="16">
        <div class="section-card">
          <div class="section-header">
            <h3 class="section-title">{{ t('home.quickEntry') }}</h3>
            <el-button :type="isEditMode ? 'default' : 'primary'" @click="toggleEditMode">
              <el-icon><Setting /></el-icon>
              <span>{{ t('common.setting') }}</span>
            </el-button>
          </div>
          
          <!-- 编辑模式 -->
          <draggable 
            v-if="isEditMode" 
            v-model="userStore.quickEntry" 
            item-key="id"
            class="quick-grid"
            :animation="300"
            ghost-class="drag-ghost"
            chosen-class="drag-chosen"
            drag-class="drag-active"
            @end="onDragEnd"
          >
            <template #item="{ element, index }">
              <div v-if="userStore.permissionMap.get(String(element.permission_id))" class="quick-card edit-mode">
                <div class="quick-icon" :style="{ backgroundColor: entryColors[index % 4] + '15', color: entryColors[index % 4] }">
                  <el-icon :size="24"><component :is="getIconComponent(userStore.permissionMap.get(String(element.permission_id))?.icon || 'Document')" /></el-icon>
                </div>
                <div class="quick-content">
                  <span class="quick-label">{{ t(userStore.permissionMap.get(String(element.permission_id))?.i18n_key || '') || userStore.permissionMap.get(String(element.permission_id))?.label }}</span>
                  <el-popconfirm :title="t('common.confirmDelete')" @confirm="handleDelete({ id: element.id } as any)">
                    <template #reference>
                      <el-button type="danger" text>{{ t('common.actions.del') }}</el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </div>
            </template>
            <template #footer>
              <div class="quick-card add-card" @click="addSelectVisible = true">
                <div class="quick-icon" style="background-color: rgba(64, 158, 255, 0.1); color: #409EFF;">
                  <el-icon :size="24"><Plus /></el-icon>
                </div>
                <div class="quick-content">
                  <span class="quick-label">{{ t('common.actions.add') }}</span>
                </div>
              </div>
            </template>
          </draggable>
          
          <!-- 正常模式 -->
          <div v-else-if="entries.length" class="quick-grid">
            <div 
              v-for="entry in entries" 
              :key="entry.path" 
              class="quick-card"
              @click="goTo(entry.path)"
            >
              <div class="quick-icon" :style="{ backgroundColor: entry.bg, color: entry.color }">
                <el-icon :size="24"><component :is="getIconComponent(entry.icon)" /></el-icon>
              </div>
              <div class="quick-content">
                <span class="quick-label">{{ entry.label }}</span>
                <el-icon class="quick-arrow"><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
          <el-empty v-else :description="t('home.noQuickEntry')" :image-size="80" />
        </div>
      </el-col>

      <!-- 最近活动 -->
      <el-col :xs="24" :lg="8">
        <div class="section-card">
          <div class="section-header">
            <h3 class="section-title">最近活动</h3>
          </div>
          <div class="activity-list">
            <div v-for="(activity, index) in activities" :key="index" class="activity-item">
              <el-tag :type="activity.type" size="small" class="activity-tag">
                {{ activity.user }}
              </el-tag>
              <div class="activity-content">
                <div class="activity-action">{{ activity.action }}</div>
                <div class="activity-time">{{ activity.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 新增选择弹窗 -->
    <el-dialog v-model="addSelectVisible" :title="t('home.addQuickEntry')" :width="isMobile ? '90%' : '400px'">
      <el-select v-model="selectedPermissionId" :placeholder="t('common.pleaseSelect')" filterable style="width: 100%">
        <el-option v-for="opt in menuOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
      </el-select>
      <template #footer>
        <el-button @click="addSelectVisible = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :disabled="!selectedPermissionId" @click="handleAdd">{{ t('common.actions.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 4px;
}

// 欢迎横幅
.welcome-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  border-radius: 16px;
  color: #fff;
  box-shadow: 0 8px 24px rgba(30, 58, 138, 0.25);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    padding: 24px;
  }
}

.welcome-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.welcome-avatar {
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.welcome-text {
  .welcome-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 8px;
    
    @media (max-width: 768px) {
      font-size: 20px;
    }
  }

  .welcome-subtitle {
    font-size: 14px;
    opacity: 0.9;
    margin: 0;
  }
}

.welcome-banner .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }

  @media (max-width: 768px) {
    width: 100%;
  }
}

// 数据统计
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: 1200px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 768px) { grid-template-columns: 1fr; }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  transition: all 0.3s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
}

.stat-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;

  .stat-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }

  .stat-value {
    :deep(.el-statistic__content) {
      font-size: 28px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      line-height: 1.2;
    }
    margin-bottom: 4px;
  }

  .stat-trend {
    font-size: 12px;
    font-weight: 500;
    
    &.positive {
      color: #67C23A;
    }
  }
}

// 区块卡片
.section-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 24px;
  height: 100%;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  .section-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: var(--el-text-color-primary);
  }
}

// 快捷入口
.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 768px) { 
    grid-template-columns: 1fr; 
  }
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
    
    .quick-arrow { 
      opacity: 1; 
      transform: translateX(0); 
    }
  }

  &.edit-mode {
    cursor: grab;
    &:active {
      cursor: grabbing;
    }
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }

  &.add-card {
    border-style: dashed;
    cursor: pointer;
  }
}

// 拖拽样式
.drag-ghost {
  opacity: 0.5;
  background: var(--el-color-primary-light-9) !important;
  border: 2px dashed var(--el-color-primary) !important;
}

.drag-chosen {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: scale(1.02);
}

.drag-active {
  opacity: 0.9;
}

.quick-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.quick-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .quick-label {
    font-size: 15px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .quick-arrow {
    color: var(--el-text-color-secondary);
    opacity: 0;
    transform: translateX(-8px);
    transition: all 0.3s;
  }
}

// 最近活动
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.activity-tag {
  flex-shrink: 0;
}

.activity-content {
  flex: 1;

  .activity-action {
    font-size: 14px;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }

  .activity-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
