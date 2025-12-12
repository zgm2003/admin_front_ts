<template>
  <el-drawer v-model="show" direction="rtl" size="350px" class="setting-drawer">
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
      <ElDivider>{{ t('header.transition') }}</ElDivider>
      <div class="toggle-list">
        <div class="setting-item"><span>{{ t('header.transitionEnable') }}</span>
          <el-switch v-model="menuStore.pageTransition" @change="pageTransition"/>
        </div>
        <div class="setting-item">
          <span>{{ t('header.transitionType') }}</span>
          <el-select-v2 v-model="menuStore.transitionName" style="width:160px" :options="transitionOptions"
                        @change="transitionName"/>
        </div>
      </div>
      <ElDivider/>
      <div class="setting-actions">
        <el-button type="danger" @click="clear">{{ t('header.clearAndReset') }}</el-button>
      </div>
      <div class="setting-actions">
        <el-button type="primary" @click="resetThemeLight">{{ t('header.resetLight') }}</el-button>
        <el-button type="warning" @click="resetThemeDark">{{ t('header.resetDark') }}</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue'
import {useMenuStore} from '@/store/menu.ts'
import {ElDivider, ElNotification} from 'element-plus'
import {useI18n} from 'vue-i18n'
import {toggleDarkMode} from '@/utils/theme'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])
const show = computed({get: () => props.modelValue, set: (v: boolean) => emit('update:modelValue', v)})
const menuStore = useMenuStore()
const {t} = useI18n()
const isDark = ref(localStorage.getItem('theme') === 'dark')
const predefineColors = ref([
  '#002141', '#409EFF', '#ffffff', '#1890ff', '#304156', '#212121',
  '#11a983', '#13c2c2', '#6959CD', '#f5222d', '#fa541c', '#fa8c16',
  '#faad14', '#fadb14', '#a0d911', '#52c41a', '#1890ff', '#40a9ff', '#69c0ff'
])
const transitionOptions = ref([
  {label: '淡入', value: 'el-fade-in'},
  {label: '线性淡入', value: 'el-fade-in-linear'},
  {label: '左侧缩放', value: 'el-zoom-in-left'},
  {label: '居中缩放', value: 'el-zoom-in-center'},
  {label: '顶部缩放', value: 'el-zoom-in-top'},
  {label: '底部缩放', value: 'el-zoom-in-bottom'},
])

function onThemeChange(val: boolean) {
  toggleDarkMode(val)
  localStorage.setItem('theme', val ? 'dark' : 'light')
  menuStore.applyDefaultMenuColor(val)
  menuStore.applyDefaultSystemColor(val)
  menuStore.applyDefaultHeaderColor(val)
  document.documentElement.style.setProperty('--el-color-primary', menuStore.systemColor)
}

function systemColor(color: string) {
  menuStore.changeSystemColor(color);
  document.documentElement.style.setProperty('--el-color-primary', color)
}

function headerColor(color: string) {
  menuStore.changeHeaderColor(color)
}

function menuColor(color: string) {
  menuStore.changeMenuColor(color)
}

function breadcrumb(val: boolean) {
  menuStore.changeBreadcrumb(val)
}

function hamburger(val: boolean) {
  menuStore.changeHamburger(val)
}

function screenfull(val: boolean) {
  menuStore.changeScreenfull(val)
}

function tabtag(val: boolean) {
  menuStore.changeTabtag(val)
}

function uniqueOpen(val: boolean) {
  menuStore.changeUniqueOpen(val)
}

function changeFooter(val: boolean) {
  menuStore.changeFooter(val)
}

function pageTransition(val: boolean) {
  menuStore.changePageTransition(val)
}

function transitionName(val: string) {
  menuStore.changeTransitionName(val)
}

function clear() {
  ElNotification({title: '提示', message: '清除缓存成功,请刷新', type: 'success'});
  localStorage.clear()
}

function resetThemeLight() {
  toggleDarkMode(false);
  menuStore.applyDefaultMenuColor(false);
  menuStore.applyDefaultSystemColor(false);
  menuStore.applyDefaultHeaderColor(false);
  localStorage.setItem('theme', 'light')
}

function resetThemeDark() {
  toggleDarkMode(true);
  menuStore.applyDefaultMenuColor(true);
  menuStore.applyDefaultSystemColor(true);
  menuStore.applyDefaultHeaderColor(true);
  localStorage.setItem('theme', 'dark')
}
</script>

<style scoped>
.setting-drawer {
  padding: 0 0 12px 0
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
  border-bottom: 1px solid #ebeef5
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 12px 0
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

.toggle-list {
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0
}

.setting-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: space-between
}

.setting-actions .el-button {
  width: 100%
}
</style>

