<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { UsersQuickEntryApi } from '@/api/user/usersQuickEntry'
import { ElMessage } from 'element-plus'
import { Setting, ArrowRight, Document, Plus, Coin } from '@element-plus/icons-vue'

const Draggable = defineAsyncComponent(() => import('vuedraggable'))

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()
const isMobile = useIsMobile()

const iconModule = shallowRef<Record<string, any>>({})
let iconModulePromise: Promise<void> | null = null
const loadIconModule = () => {
  if (Object.keys(iconModule.value).length) return Promise.resolve()
  if (!iconModulePromise) {
    iconModulePromise = import('@element-plus/icons-vue').then((mod) => {
      iconModule.value = mod as Record<string, any>
    })
  }
  return iconModulePromise
}
const scheduleIdle = (cb: () => void) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(cb)
  } else {
    setTimeout(cb, 16)
  }
}

// 快捷入口设置
const isEditMode = ref(false)
const addSelectVisible = ref(false)
const selectedPermissionId = ref<string>('')
const entryColors = ['#409EFF', '#059669', '#D97706', '#DC2626']

interface QuickEntryCardItem {
  id: number
  permissionId: number
  label: string
  icon: string
  path: string
  color: string
  bg: string
}

const getEntryColor = (index: number) => entryColors[index % entryColors.length] ?? '#409EFF'

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
const entries = computed<QuickEntryCardItem[]>(() => {
  return userStore.quickEntry
    .map((entry, index) => {
      const menu = userStore.permissionMap.get(String(entry.permission_id))
      if (!menu || !menu.path) return null
      return {
        id: entry.id,
        permissionId: entry.permission_id,
        label: menu.i18n_key ? t(menu.i18n_key) : menu.label,
        icon: menu.icon || 'Document',
        path: menu.path,
        color: getEntryColor(index),
        bg: getEntryColor(index) + '15',
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
})

const walletMenu = computed(() => {
  return Array.from(userStore.permissionMap.values()).find(
    item => item?.path === '/wallet' || item?.i18n_key === 'menu.wallet',
  ) || null
})
const walletPath = computed(() => walletMenu.value?.path || '')
const walletLabel = computed(() => {
  if (!walletMenu.value) {
    return ''
  }

  return walletMenu.value.i18n_key ? t(walletMenu.value.i18n_key) : walletMenu.value.label
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
  const mod = iconModule.value as any
  return (mod && mod[iconName]) || Document
}

const goTo = (path: string) => router.push(path)
const goToPersonal = () => router.push({ path: '/personal', query: { user_id: userStore.user_id } })
const goToWallet = () => {
  if (walletPath.value) {
    return router.push(walletPath.value)
  }
}

onMounted(() => {
  scheduleIdle(() => {
    loadIconModule().catch(() => {})
  })
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
      <div class="welcome-actions">
        <el-button plain size="large" @click="goToPersonal">
          <el-icon><Setting /></el-icon>
          <span>{{ t('menu.personal') }}</span>
        </el-button>
        <el-button v-if="walletPath" type="primary" size="large" @click="goToWallet">
          <el-icon><Coin /></el-icon>
          <span>{{ walletLabel }}</span>
        </el-button>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title">{{ t('home.quickEntry') }}</h3>
        <el-button :type="isEditMode ? 'default' : 'primary'" @click="toggleEditMode">
          <el-icon><Setting /></el-icon>
          <span>{{ t('common.setting') }}</span>
        </el-button>
      </div>
          
      <!-- 编辑模式 -->
      <Draggable 
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
      </Draggable>
      
      <!-- 正常模式 -->
      <div v-else-if="entries.length" class="quick-grid">
        <div 
          v-for="entry in entries" 
          :key="entry.id" 
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

    <!-- 新增选择弹窗 -->
    <el-dialog v-model="addSelectVisible" :title="t('home.addQuickEntry')" :width="isMobile ? '90%' : '400px'">
      <el-select-v2 v-model="selectedPermissionId" :placeholder="t('common.pleaseSelect')" filterable :options="menuOptions" style="width: 100%" />
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

.welcome-actions {
  display: flex;
  align-items: center;
  gap: 12px;

  .el-button + .el-button {
    margin-left: 0;
  }

  .el-button {
    min-width: 132px;
    backdrop-filter: blur(10px);
  }

  .el-button--default {
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: #fff;

    &:hover {
      background: rgba(255, 255, 255, 0.24);
      border-color: rgba(255, 255, 255, 0.42);
      color: #fff;
    }
  }

  .el-button--primary {
    background: #fff;
    border-color: #fff;
    color: #1d4ed8;

    &:hover {
      background: rgba(255, 255, 255, 0.92);
      border-color: rgba(255, 255, 255, 0.92);
      color: #1e40af;
    }
  }

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column;

    .el-button {
      width: 100%;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 1200px) { grid-template-columns: repeat(2, 1fr); }
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
</style>
