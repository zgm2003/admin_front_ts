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
    </div>
  </div>

  <!-- 退出确认对话框已移至 Aside -->
  
  <SettingDrawer v-model="drawer" />
  <SearchDialog v-model="searchOpen" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SettingDrawer from './components/SettingDrawer.vue'
import SearchDialog from './components/SearchDialog.vue'
import { Search, Setting, FullScreen } from '@element-plus/icons-vue'
import { useMenuStore } from '@/store/menu.ts'
import { useUserStore } from '@/store/user.ts'
import { useRouter } from 'vue-router'
import { toggleDarkMode } from '@/utils/theme'
import { useIsMobile } from '@/hooks/useResponsive'
import { useI18n } from 'vue-i18n'
import { resolveMenuLabel } from '@/utils/menuI18n'
import Cookies from 'js-cookie'

const menuStore = useMenuStore()
const userStore = useUserStore()
const router = useRouter()
const { t, locale } = useI18n()

const isDark = ref(false)
const drawer = ref(false)
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

function toggleFullScreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen()
  else if (document.exitFullscreen) document.exitFullscreen()
}

function setLang(lang) {
  locale.value = lang
  Cookies.set('lang', lang)
}
</script>

<style scoped lang="scss">
.header-bar { display: flex; align-items: center; justify-content: space-between; height: 60px; padding: 0 20px; background: var(--el-bg-color); border-bottom: 1px solid var(--el-border-color-lighter); }
.header-left { display: flex; align-items: center; gap: 16px; }
.menu-toggle, .header-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; background: transparent; border-radius: 8px; color: var(--el-text-color-regular); cursor: pointer; transition: all 0.15s; &:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); } }
.header-right { display: flex; align-items: center; gap: 4px; }

@media (max-width: 768px) {
  .header-bar { padding: 0 12px; height: 56px; }
  .header-left { gap: 8px; }
  .header-right { gap: 2px; }
  .header-btn { width: 32px; height: 32px; }
}
</style>
