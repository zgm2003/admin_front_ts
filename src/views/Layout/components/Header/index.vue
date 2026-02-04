<template>
  <div class="header-bar">
    <!-- 左侧：菜单按钮 + 面包屑 -->
    <div class="header-left">
      <button v-if="menuStore.hamburger" class="menu-toggle" @click="ClickMenu">
        <el-icon :size="20">
          <Expand v-if="menuStore.collapse" />
          <Fold v-else />
        </el-icon>
      </button>
      
      <el-breadcrumb v-if="menuStore.breadcrumb" separator="/">
        <transition-group name="breadcrumb">
          <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.index" :to="item.path ? { path: item.path } : undefined">
            {{ getBreadcrumbLabel(item) }}
          </el-breadcrumb-item>
        </transition-group>
      </el-breadcrumb>
    </div>
    
    <!-- 右侧：工具栏 -->
    <div class="header-right">
      <!-- 通知中心 -->
      <NotificationCenter />
      
      <button v-if="menuStore.screenfull" class="header-btn" @click="toggleFullScreen" :title="t('header.fullscreen')">
        <el-icon :size="18"><FullScreen /></el-icon>
      </button>
      
      <el-dropdown trigger="click" @command="setLang">
        <button class="header-btn" :title="t('common.language')">
          <Icon icon="mdi:translate" width="18" />
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
    </div>
  </div>

  <!-- 退出确认对话框已移至 Aside -->
  
  <SettingDrawer v-model="drawer" />
  <SearchDialog v-model="searchOpen" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import SettingDrawer from './components/SettingDrawer.vue'
import SearchDialog from './components/SearchDialog.vue'
import NotificationCenter from './components/NotificationCenter.vue'
import { Search, Setting, FullScreen, Expand, Fold } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import { useMenuStore } from '@/store/menu.ts'
import { useUserStore } from '@/store/user'
import { toggleDarkMode } from '@/utils/theme'
import { useIsMobile } from '@/hooks/useResponsive'
import { useI18n } from 'vue-i18n'
import { resolveMenuLabel } from '@/utils/menuI18n'
import Cookies from 'js-cookie'

const menuStore = useMenuStore()
const userStore = useUserStore()
const { t, locale } = useI18n()

const isDark = ref(false)
const drawer = ref(false)
const searchOpen = ref(false)

const breadcrumbs = computed(() => {
  const selectedIndex = menuStore.selectedMenu
  if (!selectedIndex || selectedIndex === '0') {
    return [{ index: '0', label: '首页', path: '/home', i18n_key: 'menu.home' }]
  }

  const getPath = (items: any[], target: string): any[] | null => {
    for (const item of items) {
      if (String(item.index) === target) return [item]
      if (item.children && item.children.length > 0) {
        const subPath = getPath(item.children, target)
        if (subPath) return [item, ...subPath]
      }
    }
    return null
  }

  return getPath(userStore.permissions, selectedIndex) || []
})

function getBreadcrumbLabel(item: any) {
  return resolveMenuLabel(t, item)
}

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  toggleDarkMode(isDark.value)
  // 不再强制重置为默认颜色，直接使用 store 中已持久化的主题色
  // menuStore.applyDefaultSystemColor(isDark.value)
  document.documentElement.style.setProperty('--el-color-primary', menuStore.systemColor)
})

const isMobile = useIsMobile()

function ClickMenu() {
  menuStore.toggleCollapse(isMobile.value)
}

function toggleFullScreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen()
  else if (document.exitFullscreen) document.exitFullscreen()
}

function setLang(lang: string) {
  locale.value = lang
  Cookies.set('lang', lang)
}
</script>

<style scoped lang="scss">
.header-bar { display: flex; align-items: center; justify-content: space-between; height: 60px; padding: 0 20px; background: var(--el-bg-color); border-bottom: 1px solid var(--el-border-color-lighter); }
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  overflow: hidden; // 防止面包屑过长撑开
  flex: 1;
}

:deep(.el-breadcrumb) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  
  .el-breadcrumb__item {
    float: none;
    display: inline-flex;
    align-items: center;
    
    .el-breadcrumb__inner {
      max-width: 120px; // 限制单项最大宽度
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

/* 面包屑切换动画 */
.breadcrumb-enter-active,
.breadcrumb-leave-active {
  transition: all 0.3s ease;
}

.breadcrumb-enter-from,
.breadcrumb-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.breadcrumb-move {
  transition: all 0.3s ease;
}

.breadcrumb-leave-active {
  position: absolute;
}

.menu-toggle, .header-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; background: transparent; border-radius: 8px; color: var(--el-text-color-regular); cursor: pointer; transition: all 0.15s; &:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); } }
.header-right { display: flex; align-items: center; gap: 4px; }

@media (max-width: 768px) {
  .header-bar { padding: 0 12px; height: 56px; }
  .header-left { gap: 8px; }
  .header-right { gap: 2px; }
  .header-btn { width: 32px; height: 32px; }
}
</style>
