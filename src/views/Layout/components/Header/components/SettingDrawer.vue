<template>
  <el-drawer v-model="show" direction="rtl" size="320px" class="setting-drawer">
    <template #header>
      <div class="drawer-header">
        <el-icon :size="20"><Setting /></el-icon>
        <span>{{ t('header.projectConfig') }}</span>
      </div>
    </template>
    
    <div class="setting-body">
      <!-- 主题模式 -->
      <div class="setting-section">
        <div class="section-title">{{ t('header.theme') }}</div>
        <div class="theme-switch">
          <div 
            class="theme-option" 
            :class="{ active: !isDark }" 
            @click="onThemeChange(false)"
          >
            <el-icon :size="20"><Sunny /></el-icon>
            <span>浅色</span>
          </div>
          <div 
            class="theme-option" 
            :class="{ active: isDark }" 
            @click="onThemeChange(true)"
          >
            <el-icon :size="20"><Moon /></el-icon>
            <span>深色</span>
          </div>
        </div>
      </div>
      
      <!-- 主题色 -->
      <div class="setting-section">
        <div class="section-title">{{ t('header.systemTheme') }}</div>
        <div class="color-grid">
          <div 
            v-for="c in themeColors" 
            :key="c.value" 
            class="color-item"
            :class="{ active: menuStore.systemColor === c.value }"
            :style="{ backgroundColor: c.value }"
            :title="c.label"
            @click="systemColor(c.value)"
          >
            <el-icon v-if="menuStore.systemColor === c.value" :size="14"><Check /></el-icon>
          </div>
        </div>
      </div>
      
      <!-- 界面显示 -->
      <div class="setting-section">
        <div class="section-title">{{ t('header.display') }}</div>
        <div class="setting-list">
          <div class="setting-item">
            <span>{{ t('header.breadcrumb') }}</span>
            <el-switch v-model="menuStore.breadcrumb" @change="breadcrumb" />
          </div>
          <div class="setting-item">
            <span>{{ t('header.hamburger') }}</span>
            <el-switch v-model="menuStore.hamburger" @change="hamburger" />
          </div>
          <div class="setting-item">
            <span>{{ t('header.fullscreen') }}</span>
            <el-switch v-model="menuStore.screenfull" @change="screenfull" />
          </div>
          <div class="setting-item">
            <span>{{ t('header.tab') }}</span>
            <el-switch v-model="menuStore.tabtag" @change="tabtag" />
          </div>
          <div class="setting-item">
            <span>{{ t('header.uniqueOpen') }}</span>
            <el-switch v-model="menuStore.uniqueOpen" @change="uniqueOpen" />
          </div>
          <div class="setting-item">
            <span>{{ t('header.footer') }}</span>
            <el-switch v-model="menuStore.footer" @change="changeFooter" />
          </div>
        </div>
      </div>
      
      <!-- 页面过渡 -->
      <div class="setting-section">
        <div class="section-title">{{ t('header.transition') }}</div>
        <div class="setting-list">
          <div class="setting-item">
            <span>{{ t('header.transitionEnable') }}</span>
            <el-switch v-model="menuStore.pageTransition" @change="pageTransition" />
          </div>
          <div class="setting-item">
            <span>{{ t('header.transitionType') }}</span>
            <el-select v-model="menuStore.transitionName" style="width: 140px" size="small" @change="transitionName">
              <el-option v-for="opt in transitionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="setting-actions">
        <el-button @click="clear" class="action-btn">
          <el-icon><Delete /></el-icon>
          清除缓存
        </el-button>
        <el-button type="primary" @click="resetTheme" class="action-btn">
          <el-icon><RefreshRight /></el-icon>
          重置配置
        </el-button>
      </div>
      
      <!-- 版本信息 -->
      <div v-if="tauriStore.version" class="version-section">
        <span>当前版本：v{{ tauriStore.version }}</span>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMenuStore } from '@/store/menu.ts'
import { useTauriStore } from '@/store/tauri'
import { ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { toggleDarkMode } from '@/utils/theme'
import { Setting, Sunny, Moon, Check, Delete, RefreshRight } from '@element-plus/icons-vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])
const show = computed({ get: () => props.modelValue, set: (v: boolean) => emit('update:modelValue', v) })

const menuStore = useMenuStore()
const tauriStore = useTauriStore()
const { t } = useI18n()
const isDark = ref(localStorage.getItem('theme') === 'dark')

// 企业简约风配色
const themeColors = ref([
  { label: '默认蓝', value: '#409EFF' },
  { label: '科技蓝', value: '#3B82F6' },
  { label: '专业灰', value: '#475569' },
  { label: '商务绿', value: '#059669' },
  { label: '稳重青', value: '#0891B2' },
  { label: '优雅紫', value: '#7C3AED' },
  { label: '活力橙', value: '#EA580C' },
  { label: '经典红', value: '#DC2626' },
])

const transitionOptions = ref([
  { label: '淡入淡出', value: 'fade' },
  { label: '左滑', value: 'slide-left' },
  { label: '右滑', value: 'slide-right' },
  { label: '缩放', value: 'el-zoom-in-center' },
])

function onThemeChange(dark: boolean) {
  isDark.value = dark
  toggleDarkMode(dark)
  localStorage.setItem('theme', dark ? 'dark' : 'light')
  menuStore.applyDefaultSystemColor(dark)
  document.documentElement.style.setProperty('--el-color-primary', menuStore.systemColor)
}

function systemColor(color: string) {
  menuStore.changeSystemColor(color)
  document.documentElement.style.setProperty('--el-color-primary', color)
}

function breadcrumb(val: string | number | boolean) { menuStore.changeBreadcrumb(val as boolean) }
function hamburger(val: string | number | boolean) { menuStore.changeHamburger(val as boolean) }
function screenfull(val: string | number | boolean) { menuStore.changeScreenfull(val as boolean) }
function tabtag(val: string | number | boolean) { menuStore.changeTabtag(val as boolean) }
function uniqueOpen(val: string | number | boolean) { menuStore.changeUniqueOpen(val as boolean) }
function changeFooter(val: string | number | boolean) { menuStore.changeFooter(val as boolean) }
function pageTransition(val: string | number | boolean) { menuStore.changePageTransition(val as boolean) }
function transitionName(val: string) { menuStore.changeTransitionName(val) }

function clear() {
  localStorage.clear()
  ElNotification.success({ title: '提示', message: '缓存已清除，请刷新页面' })
}

function resetTheme() {
  onThemeChange(false)
  systemColor('#409EFF')
  ElNotification.success({ title: '提示', message: '配置已重置' })
}
</script>

<style scoped lang="scss">
.drawer-header { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); }
.setting-body { padding: 0 4px; }
.setting-section { margin-bottom: 24px; }
.section-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--el-border-color-lighter); }
.theme-switch { display: flex; gap: 12px; }
.theme-option { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; border: 2px solid var(--el-border-color); border-radius: 8px; cursor: pointer; transition: all 0.15s; color: var(--el-text-color-regular); &:hover { border-color: var(--el-color-primary-light-5); color: var(--el-text-color-primary); } &.active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); color: var(--el-color-primary); } span { font-size: 13px; font-weight: 500; } }
.color-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.color-item { aspect-ratio: 1; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; transition: all 0.15s; border: 2px solid transparent; &:hover { transform: scale(1.05); } &.active { border-color: var(--el-text-color-primary); box-shadow: 0 0 0 2px var(--el-bg-color); } }
.setting-list { display: flex; flex-direction: column; gap: 4px; }
.setting-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--el-border-color-lighter); &:last-child { border-bottom: none; } span { font-size: 14px; color: var(--el-text-color-primary); } }
.setting-actions { display: flex; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--el-border-color-lighter); }
.action-btn { flex: 1; height: 40px; .el-icon { margin-right: 6px; } }
.version-section { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--el-border-color-lighter); text-align: center; font-size: 12px; color: var(--el-text-color-placeholder); }
:deep(.el-drawer__header) { padding: 16px 20px; margin-bottom: 0; border-bottom: 1px solid var(--el-border-color-lighter); }
:deep(.el-drawer__body) { padding: 20px; }
</style>
