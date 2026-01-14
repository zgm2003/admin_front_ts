<template>
  <div class="header-bar">
    <!-- 左侧：菜单按钮 + 面包屑 -->
    <div class="header-left">
      <button v-if="menuStore.hamburger" class="menu-toggle" @click="ClickMenu">
        <el-icon :size="20">
          <component :is="menuStore.collapse ? 'Expand' : 'Fold'" />
        </el-icon>
      </button>
      
      <el-breadcrumb v-if="menuStore.breadcrumb && !isMobile" separator="/">
        <el-breadcrumb-item v-for="item in menuStore.tabList" :key="item.index" :to="{ path: item.path }" replace>
          {{ getBreadcrumbLabel(item) }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <!-- 右侧：工具栏 -->
    <div class="header-right">
      <button v-if="menuStore.screenfull" class="header-btn" @click="toggleFullScreen" :title="t('header.fullscreen')">
        <el-icon :size="18"><FullScreen /></el-icon>
      </button>
      
      <el-dropdown trigger="click" @command="setLang">
        <button class="header-btn" :title="t('header.language')">
          <el-icon :size="18"><HelpFilled /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="zh-CN">{{ $t('common.zh') }}</el-dropdown-item>
            <el-dropdown-item command="en-US">{{ $t('common.en') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      
      <button class="header-btn" @click="drawer = true" :title="t('header.settings')">
        <el-icon :size="18"><Setting /></el-icon>
      </button>
      
      <button class="header-btn" @click="searchOpen = true" :title="t('header.search')">
        <el-icon :size="18"><Search /></el-icon>
      </button>
      
      <el-dropdown @command="handleUserCommand">
        <div class="user-info">
          <el-avatar :src="userStore.avatar" :size="32" />
          <span v-if="!isMobile" class="user-name">{{ userStore.nickname || '用户' }}</span>
          <el-icon class="user-arrow"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="personal">
              <el-icon><User /></el-icon>
              {{ t('header.personal') }}
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              {{ t('header.logout') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>

  <!-- 退出确认对话框 -->
  <el-dialog v-model="LoginOutShow" :title="t('header.logoutTitle')" width="400" align-center>
    <div class="logout-content">
      <el-icon class="logout-icon" :size="48"><Warning /></el-icon>
      <p>{{ t('header.logoutText') }}</p>
    </div>
    <template #footer>
      <el-button @click="LoginOutShow = false">{{ t('header.cancel') }}</el-button>
      <el-button type="primary" @click="confirmLoginOut">{{ t('header.ok') }}</el-button>
    </template>
  </el-dialog>
  
  <SettingDrawer v-model="drawer" />
  <SearchDialog v-model="searchOpen" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SettingDrawer from './components/SettingDrawer.vue'
import SearchDialog from './components/SearchDialog.vue'
import { Search, Setting, FullScreen, ArrowDown, User, SwitchButton, Warning } from '@element-plus/icons-vue'
import { useMenuStore } from '@/store/menu.ts'
import { useUserStore } from '@/store/user.ts'
import { ElNotification } from 'element-plus'
import { useRouter } from 'vue-router'
import { clearAllCookies } from '@/utils/cookie'
import { toggleDarkMode } from '@/utils/theme'
import { useIsMobile } from '@/hooks/useResponsive'
import { useI18n } from 'vue-i18n'
import { resolveMenuLabel } from '@/utils/menuI18n'
import Cookies from 'js-cookie'
import { UsersApi } from "@/api/user/users.js"

const menuStore = useMenuStore()
const userStore = useUserStore()
const router = useRouter()
const { t, locale } = useI18n()

const isDark = ref(false)
const drawer = ref(false)
const LoginOutShow = ref(false)
const searchOpen = ref(false)

function getBreadcrumbLabel(item) {
  return resolveMenuLabel(t, item)
}

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  toggleDarkMode(isDark.value)
  menuStore.applyDefaultSystemColor(isDark.value)
  document.documentElement.style.setProperty('--el-color-primary', menuStore.systemColor)
})

const isMobile = useIsMobile()

function ClickMenu() {
  menuStore.toggleCollapse(isMobile.value)
}

function confirmLoginOut() {
  UsersApi.logout({}).finally(() => {
    useMenuStore().reset()
    clearAllCookies()
    localStorage.removeItem('lastVisitedPath')
    ElNotification.success(t('common.success.operation'))
    router.push('/login')
  })
}

function toggleFullScreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen()
  else if (document.exitFullscreen) document.exitFullscreen()
}

function handleUserCommand(command) {
  if (command === 'personal') router.push({ path: '/personal', query: { user_id: userStore.user_id } })
  if (command === 'logout') LoginOutShow.value = true
}

function setLang(lang) {
  locale.value = lang
  Cookies.set('lang', lang)
}
</script>

<style scoped lang="scss">
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  
  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  
  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border-radius: 24px;
  cursor: pointer;
  transition: background var(--transition-fast);
  
  &:hover {
    background: var(--bg-hover);
  }
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-arrow {
  font-size: 12px;
  color: var(--text-muted);
}

/* 面包屑 */
:deep(.el-breadcrumb) {
  font-size: 14px;
  
  .el-breadcrumb__inner {
    color: var(--text-secondary);
    font-weight: 400;
    
    &:hover {
      color: var(--primary);
    }
  }
  
  .el-breadcrumb__item:last-child .el-breadcrumb__inner {
    color: var(--text-primary);
    font-weight: 500;
  }
}

/* 退出确认 */
.logout-content {
  text-align: center;
  padding: 20px 0;
  
  .logout-icon {
    color: var(--warning);
    margin-bottom: 16px;
  }
  
  p {
    font-size: 15px;
    color: var(--text-secondary);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .header-bar {
    padding: 0 12px;
    height: 56px;
  }
  
  .header-left {
    gap: 8px;
  }
  
  .header-right {
    gap: 2px;
  }
  
  .header-btn {
    width: 32px;
    height: 32px;
  }
}
</style>
