<template>
  <div
      class="header-bar flex items-center"
      :style="{ backgroundColor: menuStore.headerColor, color: headerTextColor, padding: '0 10px' }"
  >
    <el-button
        v-if="menuStore.hamburger"
        type="primary"
        @click="ClickMenu"
        :style="{ backgroundColor: menuStore.systemColor, marginRight: '16px' }"
    >
      <el-icon>
        <component :is="menuStore.collapse ? 'Menu' : 'Grid'"/>
      </el-icon>
    </el-button>
    <div v-if="menuStore.breadcrumb" class="breadcrumb-wrapper">
      <el-breadcrumb separator-icon="ArrowRight">
        <el-breadcrumb-item
            v-for="item in menuStore.tabList"
            :key="item.index"
            :to="{ path: item.path }"
            replace
        >
          <el-text :style="{ color: headerTextColor }">{{ getBreadcrumbLabel(item) }}</el-text>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="flex-grow"></div>
    <el-space size="large">
<!--      <el-switch-->
<!--          v-model="isDark"-->
<!--          active-action-icon="Moon"-->
<!--          inactive-action-icon="Sunny"-->
<!--          @change="onThemeChange"-->
<!--          style="margin-right: 16px"-->
<!--      />-->
      <el-button
          v-if="menuStore.screenfull"
          @click="toggleFullScreen"
          icon="FullScreen"
          circle
          style="margin-right: 8px"
      />
      <el-dropdown style="margin-right: 8px">
        <el-button circle>
          <el-icon><HelpFilled /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="setLang('zh-CN')">{{ $t('common.zh') }}</el-dropdown-item>
            <el-dropdown-item @click="setLang('en-US')">{{ $t('common.en') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button @click="drawer = true" icon="Setting" circle style="margin-right: 8px"/>
      <el-button @click="searchOpen = true" circle style="margin-right: 8px"><el-icon><Search /></el-icon></el-button>
      <el-button @click="goToBlog" icon="House" circle style="margin-right: 8px"/>
      <el-dropdown @command="handleUserCommand">
      <span class="el-dropdown-link">
        <el-avatar :src="userStore.avatar" size="small"/>
      </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="personal">{{ t('header.personal') }}</el-dropdown-item>
            <el-dropdown-item command="logout">{{ t('header.logout') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-space>
  </div>

  <el-dialog v-model="LoginOutShow" :title="t('header.logoutTitle')" width="400">
    <el-alert :title="t('header.logoutText')" type="warning" show-icon :closable="false"/>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="LoginOutShow = false">{{ t('header.cancel') }}</el-button>
        <el-button type="primary" @click="confirmLoginOut">{{ t('header.ok') }}</el-button>
      </div>
    </template>
  </el-dialog>
  <SettingDrawer v-model="drawer" />
  <SearchDialog v-model="searchOpen" />
  </template>

<script setup>
import {ref, onMounted, computed} from 'vue';
import SettingDrawer from './components/SettingDrawer.vue'
import SearchDialog from './components/SearchDialog.vue'
import { Search } from '@element-plus/icons-vue'
import {useMenuStore} from '@/store/menu.ts';
import {useUserStore} from '@/store/user.ts';
import {ElNotification, ElDivider, ElMessage} from 'element-plus';
import {useRouter} from 'vue-router';
import {clearAllCookies} from '@/utils/cookie';
import {toggleDarkMode} from '@/utils/theme';
import { useIsMobile } from '@/utils/responsive'
import { useI18n } from 'vue-i18n'
import { resolveMenuLabel } from '@/utils/menuI18n'
import Cookies from 'js-cookie'

const menuStore = useMenuStore();
const userStore = useUserStore();
const router = useRouter();
const { t, locale } = useI18n()

const isDark = ref(false);
const drawer = ref(false);
const LoginOutShow = ref(false);
const searchOpen = ref(false);

function getBreadcrumbLabel(item) { return resolveMenuLabel(t, item) }

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark';
  toggleDarkMode(isDark.value);
  menuStore.applyDefaultMenuColor(isDark.value);
  menuStore.applyDefaultSystemColor(isDark.value);
  menuStore.applyDefaultHeaderColor(isDark.value);
  document.documentElement.style.setProperty('--el-color-primary', menuStore.systemColor)
});

function onThemeChange(val) {
  toggleDarkMode(val);
  localStorage.setItem('theme', val ? 'dark' : 'light');
  menuStore.applyDefaultMenuColor(val);
  menuStore.applyDefaultSystemColor(val);
  menuStore.applyDefaultHeaderColor(val);
  document.documentElement.style.setProperty('--el-color-primary', menuStore.systemColor)
}

const isMobile = useIsMobile()

function ClickMenu() { menuStore.toggleCollapse(isMobile.value) }

function confirmLoginOut() {
  clearAllCookies();
  localStorage.removeItem('lastVisitedPath');
  ElNotification.success(t('common.success.operation'));
  router.push('/login');
}

function toggleFullScreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else if (document.exitFullscreen) document.exitFullscreen();
}


const headerTextColor = computed(() => {
  const c = (menuStore.headerColor || '').toLowerCase()
  return c === '#ffffff' || c === 'white' || c === '#fff' ? 'black' : 'white'
})

function goToBlog() { window.open('https://zgm2003.cn') }
function handleUserCommand(command) { if (command === 'personal') router.push({name: 'personal', query: {user_id: userStore.user_id}}); if (command === 'logout') LoginOutShow.value = true }
function setLang(lang) { locale.value = lang; Cookies.set('lang', lang) }

function copyConfig() {
  const text = `{
    "breadcrumb": ${menuStore.breadcrumb},
    "hamburger": ${menuStore.hamburger},
    "screenfull": ${menuStore.screenfull},
    "tabtag": ${menuStore.tabtag},
    "uniqueOpen": ${menuStore.uniqueOpen},
    "isDark": ${isDark.value},
    "menuColor": "${menuStore.menuColor}",
    "headerColor": "${menuStore.headerColor}",
    "systemColor": "${menuStore.systemColor}"
  }`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => { ElMessage.success('复制成功') }).catch(() => { ElMessage.error('复制失败') })
  } else {
    const input = document.createElement('textarea');
    input.value = text; document.body.appendChild(input); input.select();
    try { document.execCommand('copy'); ElMessage.success('复制成功') } catch { ElMessage.error('复制失败') }
    document.body.removeChild(input)
  }
}
</script>

<style scoped lang="less">
.header-bar{ display:flex; align-items:center; min-width:0; overflow:hidden; margin:10px 0 }
.flex-grow{ flex:1 }
.breadcrumb-wrapper{ margin-right:16px }
@media (max-width: 768px){ .header-bar{ padding:0 6px } :deep(.el-space){ flex-wrap:wrap } }
.setting-drawer{ padding:0 0 12px 0 }
.setting-body{ padding:12px; max-height:calc(100vh - 120px); overflow-y:auto }
.setting-header{ font-size:16px; font-weight:600; padding:12px 16px; border-bottom:1px solid #ebeef5 }
.setting-row{ display:flex; align-items:center; justify-content:center; margin:12px 0 }
.row-label{ font-size:14px; color:#606266; margin-right:16px }
.color-list{ display:flex; flex-wrap:wrap; gap:8px }
.color-block{ width:28px; height:28px; border-radius:6px; box-shadow:0 0 0 1px rgba(0,0,0,0.06) inset; cursor:pointer; position:relative }
.color-block.active{ outline:2px solid #409eff }
.color-block.active::after{ content:'✓'; position:absolute; right:-6px; top:-10px; font-size:16px; color:#409eff }
.setting-item{ display:flex; align-items:center; justify-content:space-between; padding:8px 0 }
.setting-label{ font-size:14px }
.setting-actions{ display:flex; gap:8px; margin-top:8px; justify-content:space-between; .el-button{ width:100% } }
.layout-list{ display:flex; gap:8px }
.layout-card{ width:60px; height:48px; border-radius:6px; border:1px solid #ebeef5; display:grid; grid-template-columns:14px 1fr; grid-template-rows:14px 1fr; overflow:hidden; cursor:pointer }
.layout-card.active{ border-color:#409eff; box-shadow:0 0 0 2px rgba(64,158,255,0.3) }
.layout-side{ grid-row:1/3; grid-column:1; background:#2c3e50 }
.layout-header{ grid-row:1; grid-column:2; background:#1f2a44 }
.layout-main{ grid-row:2; grid-column:2; background:#eef2f6 }
</style>
