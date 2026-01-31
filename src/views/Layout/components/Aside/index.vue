<template>
  <div class="aside-wrapper">
    <el-menu
      :default-active="menuStore.selectedMenu"
      :collapse="menuStore.collapse"
      :collapse-transition="false"
      :unique-opened="menuStore.uniqueOpen"
      class="aside-menu"
    >
      <div class="logo-container" :class="{ 'is-collapse': menuStore.collapse }">
        <div class="logo-icon"><img src="/logo.png" alt="Logo" /></div>
        <span v-show="!menuStore.collapse" class="logo-text">智澜</span>
      </div>
      <MenuItem v-for="item in userStore.permissions" :key="item.index" :item="item" />
    </el-menu>
    
    <!-- 底部用户区域 -->
    <div class="user-section" :class="{ 'is-collapse': menuStore.collapse }">
      <el-dropdown trigger="click" @command="handleUserCommand" placement="top-start">
        <div class="user-trigger">
          <el-avatar :src="userStore.avatar" :size="36" />
          <div v-show="!menuStore.collapse" class="user-info">
            <span class="user-name">{{ userStore.username || '用户' }}</span>
            <span class="user-role">{{ userStore.role_name || '成员' }}</span>
          </div>
          <el-icon v-show="!menuStore.collapse" class="user-arrow"><ArrowUp /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="personal"><el-icon><User /></el-icon>{{ t('header.personal') }}</el-dropdown-item>
            <el-dropdown-item divided command="logout"><el-icon><SwitchButton /></el-icon>{{ t('header.logout') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
  
  <el-dialog v-model="logoutVisible" :title="t('header.logoutTitle')" width="400" align-center>
    <div class="logout-content">
      <el-icon class="logout-icon" :size="48"><Warning /></el-icon>
      <p>{{ t('header.logoutText') }}</p>
    </div>
    <template #footer>
      <el-button @click="logoutVisible = false">{{ t('header.cancel') }}</el-button>
      <el-button type="primary" @click="confirmLogout">{{ t('header.ok') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMenuStore } from '@/store/menu'
import { useUserStore } from '@/store/user'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { ArrowUp, User, SwitchButton, Warning } from '@element-plus/icons-vue'
import { clearAllCookies } from '@/utils/cookie'
import { UsersApi } from '@/api/user/users'
import MenuItem from './components/MenuItem.vue'

const menuStore = useMenuStore()
const userStore = useUserStore()
const router = useRouter()
const { t } = useI18n()
const logoutVisible = ref(false)

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
.aside-wrapper { display: flex; flex-direction: column; height: 100%; background: var(--el-bg-color); }
.aside-menu { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; border-right: none; background: transparent; width: 64px; transition: width 0.2s; &:not(.el-menu--collapse) { width: 220px; } }

.logo-container { display: flex; align-items: center; height: 60px; padding: 0 20px; gap: 12px; border-bottom: 1px solid var(--el-border-color-lighter); &.is-collapse { padding: 0; justify-content: center; } }
.logo-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--el-color-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; img { width: 24px; height: 24px; filter: brightness(0) invert(1); } }
.logo-text { font-size: 18px; font-weight: 600; color: var(--el-text-color-primary); white-space: nowrap; }
.is-collapse .logo-text, .is-collapse .user-info, .is-collapse .user-arrow { display: none; }

.user-section { flex-shrink: 0; margin: 8px; padding-top: 8px; border-top: 1px solid var(--el-border-color-lighter); :deep(.el-dropdown) { display: block; width: 100%; } &.is-collapse .user-trigger { justify-content: center; padding: 8px; } }
.user-trigger { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px; cursor: pointer; background: var(--el-fill-color-lighter); &:hover { background: var(--el-fill-color); } }
.user-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.user-name { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-role { font-size: 12px; color: var(--el-text-color-secondary); }
.user-arrow { color: var(--el-text-color-placeholder); font-size: 12px; }
.logout-content { text-align: center; padding: 20px 0; .logout-icon { color: var(--el-color-warning); margin-bottom: 16px; } p { font-size: 15px; color: var(--el-text-color-regular); } }

/* 菜单 */
:deep(.el-menu-item), :deep(.el-sub-menu__title) { height: 48px; line-height: 48px; border-radius: 8px; color: var(--el-text-color-regular); &:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); } .el-icon { font-size: 18px; } }
:deep(.el-menu:not(.el-menu--collapse)) .el-menu-item, :deep(.el-menu:not(.el-menu--collapse)) .el-sub-menu__title { margin: 4px 8px; .el-icon { margin-right: 12px; } }
:deep(.el-menu-item.is-active) { background: var(--el-color-primary-light-9); color: var(--el-color-primary); font-weight: 500; &::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 20px; background: var(--el-color-primary); border-radius: 0 3px 3px 0; } }
:deep(.el-sub-menu.is-active > .el-sub-menu__title) { color: var(--el-color-primary); }
:deep(.el-menu--inline) { padding: 0 !important; .el-menu-item { padding-left: 52px !important; } }
:deep(.el-collapse-transition), :deep(.el-menu--inline), :deep(.el-sub-menu__icon-arrow) { transition: none !important; }
:deep(.el-menu--collapse) { width: 64px; .el-menu-item, .el-sub-menu__title { margin: 4px auto !important; padding: 0 !important; width: 48px !important; justify-content: center; .el-icon { margin: 0 !important; } } .el-sub-menu__title span, .el-sub-menu__icon-arrow { display: none !important; } }
</style>
