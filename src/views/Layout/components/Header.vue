<template>
  <!-- 顶部栏使用 flex 布局替代 el-menu -->
  <div
      class="header-bar flex items-center"
      :style="{ backgroundColor: menuStore.headerColor, color: headerTextColor, padding: '0 10px' }"
  >
    <!-- 左侧折叠按钮 -->
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

    <!-- 面包屑 -->
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

    <!-- 中间占位，推动右侧按钮 -->
    <div class="flex-grow"></div>
    <el-space size="large">


      <!-- 暗黑/明亮切换 -->
      <el-switch
          v-model="isDark"
          active-action-icon="Moon"
          inactive-action-icon="Sunny"
          @change="onThemeChange"
          style="margin-right: 16px"
      />

      <!-- 全屏按钮 -->
      <el-button
          v-if="menuStore.screenfull"
          @click="toggleFullScreen"
          icon="FullScreen"
          circle
          style="margin-right: 8px"
      />

      <el-dropdown style="margin-right: 8px">
        <el-button circle>
          <el-icon><Position/></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="setLang('zh-CN')">{{ $t('common.zh') }}</el-dropdown-item>
            <el-dropdown-item @click="setLang('en-US')">{{ $t('common.en') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 系统设置弹窗按钮 -->
      <el-button @click="drawer = true" icon="Setting" circle style="margin-right: 8px"/>

      <!-- 博客链接按钮 -->
      <el-button @click="goToBlog" icon="House" circle style="margin-right: 8px"/>

      <!-- 用户下拉菜单 -->
      <el-dropdown @command="handleUserCommand">
      <span class="el-dropdown-link">
        <el-avatar :src="userStore.avatar" size="large"/>
      </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="personal">个人资料</el-dropdown-item>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>

      </el-dropdown>
    </el-space>
  </div>


  <!-- Logout Dialog -->
  <el-dialog v-model="LoginOutShow" :title="t('header.logoutTitle')" width="400">
    <el-alert :title="t('header.logoutText')" type="warning" show-icon :closable="false"/>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="LoginOutShow = false">{{ t('header.cancel') }}</el-button>
        <el-button type="primary" @click="confirmLoginOut">{{ t('header.ok') }}</el-button>
      </div>
    </template>
  </el-dialog>

  <el-drawer v-model="drawer" direction="rtl" size="350px" class="setting-drawer">
    <template #header>
      <span class="setting-header">{{ t('header.projectConfig') }}</span>
    </template>
    <div class="setting-body">
      <ElDivider>{{ t('header.theme') }}</ElDivider>
      <div class="setting-row">
        <el-switch v-model="isDark" active-action-icon="Moon" inactive-action-icon="Sunny" @change="onThemeChange"/>
      </div>

      

      <ElDivider>{{ t('header.systemTheme') }}</ElDivider>
      <div class="color-list">
        <span v-for="c in predefineColors" :key="'sys-'+c" :class="['color-block', {active: menuStore.systemColor===c}]"
              :style="{backgroundColor: c}" @click="systemColor(c)"></span>
      </div>


      <ElDivider>{{ t('header.headerTheme') }}</ElDivider>
      <div class="color-list">
        <span v-for="c in predefineColors" :key="'head-'+c"
              :class="['color-block', {active: menuStore.headerColor===c}]" :style="{backgroundColor: c}"
              @click="headerColor(c)"></span>
      </div>


      <ElDivider>{{ t('header.menuTheme') }}</ElDivider>
      <div class="color-list">
        <span v-for="c in predefineColors" :key="'menu-'+c" :class="['color-block', {active: menuStore.menuColor===c}]"
              :style="{backgroundColor: c}" @click="menuColor(c)"></span>
      </div>


      <ElDivider>{{ t('header.display') }}</ElDivider>
      <div class="toggle-list">
        <div class="setting-item"><span>{{ t('header.breadcrumb') }}</span>
          <el-switch v-model="menuStore.breadcrumb" @change="breadcrumb"/>
        </div>
        <div class="setting-item"><span>{{ t('header.hamburger') }}</span>
          <el-switch v-model="menuStore.hamburger" @change="hamburger"/>
        </div>
        <div class="setting-item"><span>{{ t('header.fullscreen') }}</span>
          <el-switch v-model="menuStore.screenfull" @change="screenfull"/>
        </div>
        <div class="setting-item"><span>{{ t('header.tab') }}</span>
          <el-switch v-model="menuStore.tabtag" @change="tabtag"/>
        </div>
        <div class="setting-item"><span>{{ t('header.uniqueOpen') }}</span>
          <el-switch v-model="menuStore.uniqueOpen" @change="uniqueOpen"/>
        </div>
        <div class="setting-item"><span>{{ t('header.footer') }}</span>
          <el-switch v-model="menuStore.footer" @change="changeFooter"/>
        </div>
      </div>

      <ElDivider/>
<!--      <div class="setting-actions">-->
<!--        <el-button type="primary" class="w-100" @click="copyConfig">复制配置</el-button>-->
<!--      </div>-->
      <div class="setting-actions">
        <el-button type="danger" @click="clear">{{ t('header.clearAndReset') }}</el-button>
      </div>

      <div class="setting-actions">
        <el-button type="primary" @click="resetThemeLight">{{ t('header.resetLight') }}</el-button>
        <el-button type="warning" @click="resetThemeDark">{{ t('header.resetDark') }}</el-button>
<!--        <el-button @click="drawer=false">关闭</el-button>-->
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import {ref, onMounted, computed} from 'vue';
import {useMenuStore} from '@/store/menu.js';
import {useUserStore} from '@/store/user.js';
import {ElNotification, ElDivider, ElMessage} from 'element-plus';
import {useRouter} from 'vue-router';
import {clearAllCookies} from '@/utils/cookie';
import {toggleDarkMode} from '@/utils/theme';
import {useMediaQuery} from "@vueuse/core";
import { useI18n } from 'vue-i18n'
import Cookies from 'js-cookie'

const menuStore = useMenuStore();
const userStore = useUserStore();
const router = useRouter();
const { t, locale } = useI18n()

const isDark = ref(false);
const drawer = ref(false);
const LoginOutShow = ref(false);
const predefineColors = ref([
  '#002141', '#409EFF', '#ffffff', '#1890ff', '#304156', '#212121',
  '#11a983', '#13c2c2', '#6959CD', '#f5222d', '#fa541c', '#fa8c16',
  '#faad14', '#fadb14', '#a0d911', '#52c41a', '#1890ff', '#40a9ff', '#69c0ff'
]);

const MENU_I18N_MAP = {
  '/home': 'menu.home',
  '/userManager': 'menu.userManager',
  '/role': 'menu.role',
  '/permission': 'menu.permission',
  '/logs': 'menu.systemLog',
  '/test': 'menu.test'
}
function getBreadcrumbLabel(item) {
  const key = MENU_I18N_MAP[item.path]
  return key ? t(key) : item.label
}

// 初始化主题状态
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

const isMobile = useMediaQuery('(max-width: 768px)')

function ClickMenu() {
  menuStore.toggleCollapse(isMobile.value);
}

function confirmLoginOut() {
  clearAllCookies();
  localStorage.removeItem('lastVisitedPath');
  ElNotification.success('退出成功');
  router.push('/login');
}

function toggleFullScreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else if (document.exitFullscreen) document.exitFullscreen();
}


function menuColor(color) {
  menuStore.changeMenuColor(color);
}

function headerColor(color) {
  menuStore.changeHeaderColor(color);
}

function systemColor(color) {
  menuStore.changeSystemColor(color);
  document.documentElement.style.setProperty('--el-color-primary', color)
}

function breadcrumb(val) {
  menuStore.changeBreadcrumb(val);
}

function hamburger(val) {
  menuStore.changeHamburger(val);
}

function screenfull(val) {
  menuStore.changeScreenfull(val);
}

function tabtag(val) {
  menuStore.changeTabtag(val);
}

function uniqueOpen(val) {
  menuStore.changeUniqueOpen(val);
}

function changeFooter(val) {
  menuStore.changeFooter(val);
}

 

const headerTextColor = computed(() => {
  const c = (menuStore.headerColor || '').toLowerCase()
  return c === '#ffffff' || c === 'white' || c === '#fff' ? 'black' : 'white'
})

function clear() {
  ElNotification({title: '提示', message: '清除缓存成功,请刷新', type: 'success'});
  localStorage.clear();
  clearAllCookies();
}

function resetThemeLight() {
  toggleDarkMode(false);
  menuStore.applyDefaultMenuColor(false);
  menuStore.applyDefaultSystemColor(false);
  menuStore.applyDefaultHeaderColor(false);
  localStorage.setItem('theme', 'light');
}

function resetThemeDark() {
  toggleDarkMode(true);
  menuStore.applyDefaultMenuColor(true);
  menuStore.applyDefaultSystemColor(true);
  menuStore.applyDefaultHeaderColor(true);
  localStorage.setItem('theme', 'dark');
}

function goToBlog() {
  window.open('https://zgm2003.cn');
}

function handleUserCommand(command) {
  if (command === 'personal') {
    //跳转个人中心，带上用户信息
    router.push({name: 'personal', query: {user_id: userStore.user_id}})
  }
  if (command === 'logout') LoginOutShow.value = true;
}

function setLang(lang) {
  locale.value = lang
  Cookies.set('lang', lang)
}

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
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success('复制成功')
    }).catch(() => {
      ElMessage.error('复制失败')
    })
  } else {
    const input = document.createElement('textarea');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      ElMessage.success('复制成功')
    } catch {
      ElMessage.error('复制失败')
    }
    document.body.removeChild(input)
  }
}

</script>

<style scoped lang="less">
.header-bar {
  display: flex;
  align-items: center;
}

.flex-grow {
  flex: 1;
}

.breadcrumb-wrapper {
  margin-right: 16px;
}

.setting-drawer {
  padding: 0 0 12px 0;
}

.setting-body {
  padding: 12px;
  max-height: calc(100vh - 120px);
  overflow-y: auto
}

.setting-header {
  font-size: 16px;
  font-weight: 600;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 12px 0
}

.row-label {
  font-size: 14px;
  color: #606266;
  margin-right: 16px
}

.color-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px
}

.color-block {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06) inset;
  cursor: pointer;
  position: relative
}

.color-block.active {
  outline: 2px solid #409eff
}

.color-block.active::after {
  content: '✓';
  position: absolute;
  right: -6px;
  top: -10px;
  font-size: 16px;
  color: #409eff
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.setting-label {
  font-size: 14px;
}

.setting-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: space-between;
  .el-button{
    width: 100%;
  }
}

.layout-list {
  display: flex;
  gap: 8px
}

.layout-card {
  width: 60px;
  height: 48px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  display: grid;
  grid-template-columns:14px 1fr;
  grid-template-rows:14px 1fr;
  overflow: hidden;
  cursor: pointer
}

.layout-card.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3)
}

.layout-side {
  grid-row: 1/3;
  grid-column: 1;
  background: #2c3e50
}

.layout-header {
  grid-row: 1;
  grid-column: 2;
  background: #1f2a44
}

.layout-main {
  grid-row: 2;
  grid-column: 2;
  background: #eef2f6
}

.layout-side.light {
  background: #eef2f6
}

.layout-header.dark {
  background: #2c3e50
}

.layout-main.light {
  background: #ffffff
}

.toggle-list {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}
</style>
