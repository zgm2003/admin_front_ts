<template>
  <div class="header-bar" :class="{ 'header-bar--draggable': isTauri() }">
    <!-- 左侧：菜单按钮 + 面包屑 -->
    <div class="header-left">
      <el-button v-if="menuStore.hamburger" text class="menu-toggle" @click="ClickMenu">
        <el-icon :size="20">
          <Expand v-if="menuStore.collapse" />
          <Fold v-else />
        </el-icon>
      </el-button>
      
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
      
      <!-- 下载管理（仅 Tauri 环境） -->
      <el-badge v-if="isTauri()" :value="downloadCount" :hidden="downloadCount === 0" :max="99">
        <el-button text :title="t('header.downloads')" @click="showDownloadManager = true">
          <DIcon icon="Download" :size="18" />
        </el-button>
      </el-badge>
      
      <el-dropdown trigger="click" @command="setLang">
        <el-button text :title="t('common.language')">
          <DIcon icon="mdi:translate" :size="18" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="zh-CN">{{ $t('common.zh') }}</el-dropdown-item>
            <el-dropdown-item command="en-US">{{ $t('common.en') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      
      <el-button text :title="t('header.settings')" @click="drawer = true">
        <DIcon icon="Setting" :size="18" />
      </el-button>
      
      <el-button text :title="t('header.search')" @click="searchOpen = true">
        <DIcon icon="Search" :size="18" />
      </el-button>
      
      <!-- Tauri 窗口控制按钮 -->
      <WindowControls />
    </div>
  </div>

  <!-- 退出确认对话框已移至 Aside -->
  
  <SettingDrawer v-model="drawer" />
  <SearchDialog v-model="searchOpen" />
  
  <!-- 下载管理器抽屉（仅 Tauri 环境） -->
  <DownloadManager v-if="isTauri()" v-model:visible="showDownloadManager" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import SettingDrawer from './components/SettingDrawer.vue'
import SearchDialog from './components/SearchDialog.vue'
import NotificationCenter from './components/NotificationCenter.vue'
import WindowControls from './components/WindowControls.vue'
import { Expand, Fold } from '@element-plus/icons-vue'
import { DIcon } from '@/components/DIcon'
import { useMenuStore, HOME_MENU_ITEM } from '@/store/menu.ts'
import { useUserStore } from '@/store/user'
import { toggleDarkMode } from '@/utils/theme'
import { useIsMobile } from '@/hooks/useResponsive'
import { useI18n } from 'vue-i18n'
import { resolveMenuLabel } from '@/utils/menuI18n'
import Cookies from 'js-cookie'
import { downloadManager, DownloadManager } from '@/components/DownloadManager'
import { isTauri } from '@/store/tauri'

const menuStore = useMenuStore()
const userStore = useUserStore()
const { t, locale } = useI18n()

const isDark = ref(false)
const drawer = ref(false)
const searchOpen = ref(false)
const showDownloadManager = ref(false)
const downloadCount = ref(0)

const breadcrumbs = computed(() => {
  const selectedIndex = menuStore.selectedMenu
  if (!selectedIndex || selectedIndex === '0') {
    return [HOME_MENU_ITEM]
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

// 更新下载数量
async function updateDownloadCount() {
  if (!isTauri()) return
  const downloads = await downloadManager.getAllDownloads()
  downloadCount.value = downloads.filter(d => d.status === 'downloading').length
}

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  toggleDarkMode(isDark.value)
  // 不再强制重置为默认颜色，直接使用 store 中已持久化的主题色
  // menuStore.applyDefaultSystemColor(isDark.value)
  document.documentElement.style.setProperty('--el-color-primary', menuStore.systemColor)
  
  // 定时更新下载数量（仅 Tauri 环境）
  if (isTauri()) {
    updateDownloadCount()
    setInterval(updateDownloadCount, 2000)
  }
})

const isMobile = useIsMobile()

function ClickMenu() {
  menuStore.toggleCollapse(isMobile.value)
}

function setLang(lang: string) {
  locale.value = lang
  Cookies.set('lang', lang)
}
</script>

<style scoped lang="scss">
.header-bar { display: flex; align-items: center; justify-content: space-between; height: 60px; padding: 0 20px; background: var(--el-bg-color); border-bottom: 1px solid var(--el-border-color-lighter); }
.header-bar--draggable { -webkit-app-region: drag; }
.header-left { display: flex; align-items: center; gap: 16px; overflow: hidden; flex: 1; -webkit-app-region: no-drag; }
.header-right { display: flex; align-items: center; gap: 4px; -webkit-app-region: no-drag; :deep(.el-button + .el-button) { margin-left: 0; } }
.menu-toggle { padding: 8px; }

:deep(.el-breadcrumb) {
  display: flex; align-items: center; white-space: nowrap; overflow: hidden;
  .el-breadcrumb__item { float: none; display: inline-flex; align-items: center; }
  .el-breadcrumb__inner { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

.breadcrumb-enter-active, .breadcrumb-leave-active { transition: all 0.3s; }
.breadcrumb-enter-from, .breadcrumb-leave-to { opacity: 0; transform: translateX(20px); }
.breadcrumb-move { transition: all 0.3s; }
.breadcrumb-leave-active { position: absolute; }

@media (max-width: 768px) {
  .header-bar { padding: 0 12px; height: 56px; }
  .header-left { gap: 8px; }
  .header-right { gap: 2px; }
}
</style>
