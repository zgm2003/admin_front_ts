<template>
  <div
    class="aside-wrapper"
    :class="{ 'is-collapse': menuStore.collapse }"
  >
    <div class="logo-container">
      <div class="logo-icon">
        <img
          src="/logo.png"
          alt="Logo"
        >
      </div>
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
      <MenuItem
        v-for="item in userStore.permissions"
        :key="item.index"
        :item="item"
      />
    </el-menu>

    <div class="user-section">
      <el-dropdown
        trigger="click"
        placement="top-start"
        @command="handleUserCommand"
      >
        <button
          type="button"
          class="user-trigger"
        >
          <el-avatar
            :src="userStore.avatar"
            :size="38"
          />
          <div class="user-meta">
            <div class="user-copy">
              <span class="user-name">{{ userStore.username || defaultUserName }}</span>
              <span class="user-role">{{ userStore.role_name || defaultRoleName }}</span>
            </div>
            <el-icon class="user-arrow">
              <ArrowUp />
            </el-icon>
          </div>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="personal">
              <el-icon><User /></el-icon>{{ t('header.personal') }}
            </el-dropdown-item>
            <el-dropdown-item command="wallet">
              <el-icon><Wallet /></el-icon>{{ t('header.myWallet') }}
            </el-dropdown-item>
            <el-dropdown-item
              divided
              command="logout"
            >
              <el-icon><SwitchButton /></el-icon>{{ t('header.logout') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>

  <AppDialog
    v-model="logoutVisible"
    :title="t('header.logoutTitle')"
    width="400"
    align-center
  >
    <div class="logout-content">
      <el-icon
        class="logout-icon"
        :size="48"
      >
        <Warning />
      </el-icon>
      <p>{{ t('header.logoutText') }}</p>
    </div>
    <template #footer>
      <el-button @click="logoutVisible = false">
        {{ t('header.cancel') }}
      </el-button>
      <el-button
        type="primary"
        @click="confirmLogout"
      >
        {{ t('header.ok') }}
      </el-button>
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
import { ArrowUp, User, Wallet, SwitchButton, Warning } from '@element-plus/icons-vue'
import { useAppKernel } from '@/app/injection'
import MenuItem from './components/MenuItem.vue'

const menuStore = useMenuStore()
const userStore = useUserStore()
const kernel = useAppKernel()
const router = useRouter()
const { t } = useI18n()
const logoutVisible = ref(false)
const brandLabel = '\u667a\u6f9c'
const defaultUserName = '\u7528\u6237'
const defaultRoleName = '\u6210\u5458'

const handleUserCommand = (cmd: string) => {
  if (cmd === 'personal') router.push({ path: '/personal', query: { user_id: userStore.user_id } })
  else if (cmd === 'wallet') router.push({ path: '/profile/wallet' })
  else if (cmd === 'logout') logoutVisible.value = true
}

const confirmLogout = async () => {
  try {
    await kernel.logout()
    ElNotification.success(t('common.success.operation'))
  } finally {
    logoutVisible.value = false
  }
}
</script>

<style scoped lang="scss" src="./styles.scss"></style>
