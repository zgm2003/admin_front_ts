<template>
  <div class="header-bar">
    <div class="header-left">
      <el-button
        v-if="menuStore.hamburger"
        text
        class="menu-toggle"
        @click="handleMenuToggle"
      >
        <el-icon :size="20">
          <Expand v-if="menuStore.collapse" />
          <Fold v-else />
        </el-icon>
      </el-button>

      <el-breadcrumb
        v-if="menuStore.breadcrumb"
        separator="/"
      >
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
      <el-dropdown
        trigger="click"
        @command="setLang"
      >
        <el-button
          text
          :title="t('common.language')"
        >
          <DIcon
            icon="mdi:translate"
            :size="18"
          />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="zh-CN">
              {{ $t('common.zh') }}
            </el-dropdown-item>
            <el-dropdown-item command="en-US">
              {{ $t('common.en') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-button
        text
        :title="t('header.settings')"
        @click="drawer = true"
      >
        <DIcon
          icon="Setting"
          :size="18"
        />
      </el-button>

      <el-button
        text
        :title="t('header.search')"
        @click="searchOpen = true"
      >
        <DIcon
          icon="Search"
          :size="18"
        />
      </el-button>

    </div>
  </div>

  <SettingDrawer v-model="drawer" />
  <SearchDialog v-model="searchOpen" />
</template>

<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { Expand, Fold } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { DIcon } from '@/components/DIcon'
import { useIsMobile } from '@/hooks/useResponsive'
import { useMenuStore, HOME_MENU_ITEM } from '@/store/menu.ts'
import { useUserStore } from '@/store/user'
import { toggleDarkMode } from '@/hooks/useTheme'
import { useAppKernel } from '@/app/injection'
import {
  readDevicePreferences,
  writeDevicePreferences,
} from '@/modules/persistence/preferences'
import { resolveMenuLabel } from '@/views/Layout/utils/menuLabel'
import type { PermissionMenuItem } from '@/types/user'
import SearchDialog from './components/SearchDialog.vue'
import SettingDrawer from './components/SettingDrawer.vue'

const menuStore = useMenuStore()
const userStore = useUserStore()
const kernel = useAppKernel()
const isMobile = useIsMobile()
const { t, locale } = useI18n()

const isDark = shallowRef(false)
const drawer = shallowRef(false)
const searchOpen = shallowRef(false)

function findBreadcrumbPath(items: PermissionMenuItem[], target: string): PermissionMenuItem[] | null {
  for (const item of items) {
    if (item.index === target) return [item]

    if (item.children.length > 0) {
      const childPath = findBreadcrumbPath(item.children, target)
      if (childPath !== null) return [item, ...childPath]
    }
  }

  return null
}

const breadcrumbs = computed(() => {
  const selectedIndex = menuStore.selectedMenu
  if ([HOME_MENU_ITEM.index, ''].includes(selectedIndex)) {
    return [HOME_MENU_ITEM]
  }

  const matchedPath = findBreadcrumbPath(userStore.permissions, selectedIndex)
  if (matchedPath !== null) return matchedPath

  return []
})

function getBreadcrumbLabel(item: PermissionMenuItem) {
  return resolveMenuLabel(t, item)
}

function handleMenuToggle() {
  menuStore.toggleCollapse(isMobile.value)
}

function setLang(lang: string) {
  if (lang !== 'zh-CN' && lang !== 'en-US') return
  locale.value = lang
  writeDevicePreferences(kernel.persistence, {
    ...readDevicePreferences(kernel.persistence),
    language: lang,
  })
}

onMounted(() => {
  isDark.value = readDevicePreferences(kernel.persistence).theme === 'dark'
  toggleDarkMode(isDark.value)
  document.documentElement.style.setProperty('--el-color-primary', menuStore.systemColor)

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

.header-left {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;

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
