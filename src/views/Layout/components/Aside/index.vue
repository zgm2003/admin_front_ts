<template>
  <div class="aside-wrapper" :class="{ 'is-collapse': menuStore.collapse }">
    <div class="logo-container">
      <div class="logo-icon"><img src="/logo.png" alt="Logo" /></div>
      <div class="logo-copy">
        <span class="logo-text">{{ brandLabel }}</span>
      </div>
    </div>

    <el-menu
      :default-active="menuStore.selectedMenu"
      :collapse="menuStore.collapse"
      :collapse-transition="false"
      :unique-opened="menuStore.uniqueOpen"
      class="aside-menu"
    >
      <MenuItem v-for="item in userStore.permissions" :key="item.index" :item="item" />
    </el-menu>

    <div class="user-section">
      <el-dropdown trigger="click" @command="handleUserCommand" placement="top-start">
        <button type="button" class="user-trigger">
          <el-avatar :src="userStore.avatar" :size="38" />
          <div class="user-meta">
            <div class="user-copy">
              <span class="user-name">{{ userStore.username || defaultUserName }}</span>
              <span class="user-role">{{ userStore.role_name || defaultRoleName }}</span>
            </div>
            <el-icon class="user-arrow"><ArrowUp /></el-icon>
          </div>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="personal"><el-icon><User /></el-icon>{{ t('header.personal') }}</el-dropdown-item>
            <el-dropdown-item divided command="logout"><el-icon><SwitchButton /></el-icon>{{ t('header.logout') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>

  <AppDialog v-model="logoutVisible" :title="t('header.logoutTitle')" width="400" align-center>
    <div class="logout-content">
      <el-icon class="logout-icon" :size="48"><Warning /></el-icon>
      <p>{{ t('header.logoutText') }}</p>
    </div>
    <template #footer>
      <el-button @click="logoutVisible = false">{{ t('header.cancel') }}</el-button>
      <el-button type="primary" @click="confirmLogout">{{ t('header.ok') }}</el-button>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AppDialog } from '@/components/AppDialog'
import { useMenuStore } from '@/store/menu'
import { useUserStore } from '@/store/user'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { ArrowUp, User, SwitchButton, Warning } from '@element-plus/icons-vue'
import { clearAllCookies } from '@/utils/storage.ts'
import { UsersApi } from '@/api/user/users'
import MenuItem from './components/MenuItem.vue'

const menuStore = useMenuStore()
const userStore = useUserStore()
const router = useRouter()
const { t } = useI18n()
const logoutVisible = ref(false)
const brandLabel = '\u667a\u6f9c'
const defaultUserName = '\u7528\u6237'
const defaultRoleName = '\u6210\u5458'

const handleUserCommand = (cmd: string) => {
  if (cmd === 'personal') router.push({ path: '/personal', query: { user_id: userStore.user_id } })
  else if (cmd === 'logout') logoutVisible.value = true
}

const confirmLogout = () => {
  UsersApi.logout({}).finally(() => {
    menuStore.reset()
    clearAllCookies()
    localStorage.removeItem('lastVisitedPath')
    ElNotification.success(t('common.success.operation'))
    router.push('/login')
  })
}
</script>

<style scoped lang="scss">
.aside-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 12px 12px;
  overflow: hidden;
  color: var(--shell-nav-text);
  background: linear-gradient(180deg, var(--shell-nav-bg) 0%, var(--shell-nav-bg-soft) 100%);
  border-right: 1px solid var(--shell-nav-line);
  transition: background-color var(--app-motion-fast) var(--app-ease-standard);

  &.is-collapse {
    .logo-container {
      justify-content: center;
      padding-inline: 6px;
      gap: 0;
    }

    .logo-copy,
    .user-meta {
      width: 0;
      flex: 0 0 0;
      margin: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .aside-menu {
      scrollbar-gutter: auto;
    }

    .user-trigger {
      justify-content: center;
      padding-inline: 8px;
      gap: 0;
    }
  }
}

.logo-container {
  min-height: 58px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 2px 6px 12px;
  border-bottom: 1px solid var(--shell-nav-line);
}

.logo-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--shell-nav-accent) 26%, transparent);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--shell-nav-accent) 82%, white 18%),
    var(--shell-nav-accent)
  );
  box-shadow: 0 14px 26px var(--shell-nav-glow);

  img {
    width: 22px;
    height: 22px;
    filter: brightness(0) invert(1);
  }
}

.logo-copy,
.user-meta {
  min-width: 0;
  overflow: hidden;
}

.logo-text {
  display: block;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.01em;
  color: var(--shell-nav-text);
  white-space: nowrap;
}

.aside-menu {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  padding: 4px 0;
  border-right: none;
  background: transparent;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
}

:deep(.el-collapse-transition),
:deep(.el-sub-menu .el-menu) {
  transition: none !important;
}

.user-section {
  flex-shrink: 0;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--shell-nav-line);

  :deep(.el-dropdown) {
    display: block;
    width: 100%;
  }
}

.user-trigger {
  width: 100%;
  min-height: 58px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  font: inherit;
  text-align: left;
  appearance: none;
  border: 1px solid var(--shell-nav-line);
  border-radius: 16px;
  background: var(--shell-nav-panel);
  color: inherit;
  cursor: pointer;
  transition:
    background-color var(--app-motion-fast) var(--app-ease-standard),
    border-color var(--app-motion-fast) var(--app-ease-standard);

  &:hover {
    border-color: var(--shell-nav-active-border);
    background: color-mix(in srgb, var(--shell-nav-hover) 72%, var(--shell-nav-active) 28%);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--shell-nav-bg), 0 0 0 4px var(--shell-focus-ring);
  }
}

.user-meta {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.user-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  color: var(--shell-nav-text);
}

.user-role {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--shell-nav-muted);
}

.user-arrow {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--shell-nav-muted);
  transition:
    transform var(--app-motion-fast) var(--app-ease-standard),
    color var(--app-motion-fast) var(--app-ease-standard);
}

.user-trigger:hover .user-arrow {
  transform: translateY(-1px);
  color: var(--shell-nav-text);
}

.logout-content {
  padding: 20px 0;
  text-align: center;

  .logout-icon {
    margin-bottom: 16px;
    color: var(--el-color-warning);
  }

  p {
    font-size: 15px;
    color: var(--el-text-color-regular);
  }
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  margin: 4px 0;
  padding: 0 12px !important;
  border: 1px solid transparent;
  border-radius: 14px;
  color: var(--shell-nav-muted);
  font-weight: 600;
  overflow: hidden;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition:
    background var(--app-motion-fast) var(--app-ease-standard),
    color var(--app-motion-fast) var(--app-ease-standard),
    border-color var(--app-motion-fast) var(--app-ease-standard);

  &:hover {
    color: var(--shell-nav-text);
    background: var(--shell-nav-hover);
  }

  .d-icon,
  .el-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: inherit;
  }

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

:deep(.el-menu-item.is-active),
:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: var(--shell-nav-text);
  background: linear-gradient(90deg, var(--shell-nav-active), transparent 92%);
  border-color: var(--shell-nav-active-border);
}

:deep(.el-menu-item.is-active .d-icon),
:deep(.el-sub-menu.is-active > .el-sub-menu__title .d-icon),
:deep(.el-menu-item.is-active .el-icon),
:deep(.el-sub-menu.is-active > .el-sub-menu__title .el-icon) {
  color: var(--shell-nav-accent);
}

:deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
  color: var(--shell-nav-text);
  background: var(--shell-nav-hover);
}

:deep(.el-menu--inline) {
  padding: 4px 0 4px 8px !important;
  background: transparent !important;
  overflow: hidden;
}

:deep(.el-menu--inline .el-menu-item) {
  height: 40px;
  margin: 3px 0;
  padding-left: 34px !important;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

:deep(.el-menu--inline .el-menu-item::before) {
  left: 10px;
}

:deep(.el-sub-menu__icon-arrow) {
  position: static !important;
  width: auto;
  height: auto;
  margin: 0 0 0 auto;
  flex-shrink: 0;
  color: var(--shell-nav-muted);
}

:deep(.el-menu--collapse) {
  width: 100%;

  .el-menu-item,
  .el-sub-menu__title {
    padding: 0 !important;
    justify-content: center;
    gap: 0;
    border-radius: 12px;
  }

  .el-menu-item span,
  .el-sub-menu__title span,
  .el-sub-menu__icon-arrow {
    display: none !important;
  }
}


@media (max-width: 768px) {
  .aside-wrapper {
    width: 100%;
    padding: 18px 14px 14px;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  .logo-container {
    padding-top: 0;
  }

  .user-trigger {
    min-height: 60px;
  }

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title),
  :deep(.el-menu--inline .el-menu-item) {
    min-height: 44px;
  }
}
</style>
