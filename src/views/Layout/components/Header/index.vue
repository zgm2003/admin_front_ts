<template>
  <div class="header-bar" :class="{ 'header-bar--draggable': isTauri() }">
    <div class="header-left">
      <el-button v-if="menuStore.hamburger" text class="menu-toggle" @click="handleMenuToggle">
        <el-icon :size="20">
          <Expand v-if="menuStore.collapse" />
          <Fold v-else />
        </el-icon>
      </el-button>

      <el-breadcrumb v-if="menuStore.breadcrumb" separator="/">
        <transition-group name="breadcrumb">
          <el-breadcrumb-item
            v-for="item in breadcrumbs"
            :key="item.index"
            :to="item.path ? { path: item.path } : undefined"
          >
            {{ getBreadcrumbLabel(item) }}
          </el-breadcrumb-item>
        </transition-group>
      </el-breadcrumb>
    </div>

    <div class="header-right">
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

      <WindowControls />
    </div>
  </div>

  <SettingDrawer v-model="drawer" />
  <SearchDialog v-model="searchOpen" />
  <DownloadManager v-if="isTauri()" v-model:visible="showDownloadManager" />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Cookies from 'js-cookie'
import { Expand, Fold } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { DIcon } from '@/components/DIcon'
import { downloadManager, DownloadManager } from '@/components/DownloadManager'
import { useIsMobile } from '@/hooks/useResponsive'
import { useMenuStore, HOME_MENU_ITEM } from '@/store/menu.ts'
import { isTauri } from '@/platform/tauri'
import { useUserStore } from '@/store/user'
import { toggleDarkMode } from '@/hooks/useTheme'
import { resolveMenuLabel } from '@/views/Layout/utils/menuLabel'
import SearchDialog from './components/SearchDialog.vue'
import SettingDrawer from './components/SettingDrawer.vue'
import WindowControls from './components/WindowControls.vue'

const menuStore = useMenuStore()
const userStore = useUserStore()
const isMobile = useIsMobile()
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
      if (item.children?.length) {
        const childPath = getPath(item.children, target)
        if (childPath) return [item, ...childPath]
      }
    }
    return null
  }

  return getPath(userStore.permissions, selectedIndex) || []
})

let downloadTimer: number | null = null

function getBreadcrumbLabel(item: any) {
  return resolveMenuLabel(t, item)
}

async function updateDownloadCount() {
  if (!isTauri()) return

  const downloads = await downloadManager.getAllDownloads()
  const activeCount = downloads.filter(d => d.status === 'downloading').length
  downloadCount.value = activeCount

  if (activeCount > 0) {
    startDownloadPolling()
  } else {
    stopDownloadPolling()
  }
}

function startDownloadPolling() {
  if (downloadTimer) return
  downloadTimer = window.setInterval(updateDownloadCount, 2000)
}

function stopDownloadPolling() {
  if (!downloadTimer) return
  clearInterval(downloadTimer)
  downloadTimer = null
}

function handleMenuToggle() {
  menuStore.toggleCollapse(isMobile.value)
}

function setLang(lang: string) {
  locale.value = lang
  Cookies.set('lang', lang)
}

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  toggleDarkMode(isDark.value)
  document.documentElement.style.setProperty('--el-color-primary', menuStore.systemColor)

  if (isTauri()) {
    updateDownloadCount()
    window.addEventListener('download-started', updateDownloadCount)
  }
})

onUnmounted(() => {
  stopDownloadPolling()
  window.removeEventListener('download-started', updateDownloadCount)
})
</script>

<style scoped lang="scss">
@mixin header-btn {
  width: 34px;
  height: 34px;
  padding: 0;
  color: var(--shell-text-soft);
  border: 1px solid var(--shell-line);
  border-radius: 10px;
  background: var(--shell-panel);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition:
    color var(--app-motion-fast) var(--app-ease-standard),
    background-color var(--app-motion-fast) var(--app-ease-standard),
    border-color var(--app-motion-fast) var(--app-ease-standard),
    transform var(--app-motion-fast) var(--app-ease-standard);

  &:hover {
    color: var(--shell-text-strong);
    background: var(--shell-hover);
    border-color: var(--shell-line-strong);
    transform: translateY(-1px);
  }
}
.header-bar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--shell-panel-strong);
}

.header-bar--draggable {
  -webkit-app-region: drag;
}

.header-left {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  -webkit-app-region: no-drag;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  -webkit-app-region: no-drag;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }

  :deep(.el-button.is-text) {
    @include header-btn;
  }
}

.menu-toggle {
  @include header-btn;
}

:deep(.el-breadcrumb) {
  display: flex;
  align-items: center;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;

  .el-breadcrumb__item {
    float: none;
    display: inline-flex;
    align-items: center;
    font-size: 13px;
  }

  .el-breadcrumb__separator {
    color: var(--shell-text-soft);
    margin-inline: 8px;
  }

  .el-breadcrumb__inner {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--shell-text-soft);
    font-weight: 500;
  }

  .el-breadcrumb__inner.is-link {
    color: var(--shell-text-soft);
    font-weight: 600;
    transition: color var(--app-motion-fast) var(--app-ease-standard);
  }

  .el-breadcrumb__inner.is-link:hover {
    color: var(--shell-text-strong);
  }

  .el-breadcrumb__item:last-child .el-breadcrumb__inner {
    color: var(--shell-text-strong);
    font-weight: 700;
  }
}

.breadcrumb-enter-active,
.breadcrumb-leave-active {
  transition:
    opacity var(--app-motion-fast) var(--app-ease-standard),
    transform var(--app-motion-fast) var(--app-ease-standard);
}

.breadcrumb-enter-from,
.breadcrumb-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

.breadcrumb-move {
  transition: transform var(--app-motion-fast) var(--app-ease-standard);
}

.breadcrumb-leave-active {
  position: absolute;
}

@media (max-width: 768px) {
  .header-bar {
    height: 48px;
    padding: 0 8px;
  }

  .header-left {
    gap: 6px;
  }

  .header-right {
    gap: 0;
  }

  .menu-toggle,
  :deep(.header-right .el-button.is-text) {
    width: 36px;
    height: 36px;
    border-color: transparent;
    background: transparent;
  }

  :deep(.el-breadcrumb .el-breadcrumb__inner) {
    max-width: 96px;
  }
}
</style>
