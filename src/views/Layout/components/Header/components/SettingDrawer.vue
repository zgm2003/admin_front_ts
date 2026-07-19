<template>
  <el-drawer
    v-model="show"
    direction="rtl"
    size="320px"
    class="setting-drawer"
  >
    <template #header>
      <div class="drawer-header">
        <el-icon :size="20">
          <Setting />
        </el-icon>
        <span>{{ t('header.projectConfig') }}</span>
      </div>
    </template>
    
    <div class="setting-body">
      <!-- 主题模式 -->
      <div class="setting-section">
        <div class="section-title">
          {{ t('header.theme') }}
        </div>
        <div class="theme-switch">
          <div 
            class="theme-option" 
            :class="{ active: !isDark }" 
            @click="onThemeChange(false)"
          >
            <el-icon :size="20">
              <Sunny />
            </el-icon>
            <span>{{ t('header.lightMode') }}</span>
          </div>
          <div 
            class="theme-option" 
            :class="{ active: isDark }" 
            @click="onThemeChange(true)"
          >
            <el-icon :size="20">
              <Moon />
            </el-icon>
            <span>{{ t('header.darkMode') }}</span>
          </div>
        </div>
      </div>
      
      <!-- 主题色 -->
      <div class="setting-section">
        <div class="section-title">
          {{ t('header.systemTheme') }}
        </div>
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
            <el-icon
              v-if="menuStore.systemColor === c.value"
              :size="14"
            >
              <Check />
            </el-icon>
          </div>
          <div class="color-item custom-picker-wrapper">
            <el-color-picker
              v-model="customColor"
              @change="onCustomColor"
            />
          </div>
        </div>
      </div>
      
      <!-- 界面显示 -->
      <div class="setting-section">
        <div class="section-title">
          {{ t('header.display') }}
        </div>
        <div class="setting-list">
          <div class="setting-item">
            <span>{{ t('header.breadcrumb') }}</span>
            <el-switch
              v-model="menuStore.breadcrumb"
              @change="breadcrumb"
            />
          </div>
          <div class="setting-item">
            <span>{{ t('header.hamburger') }}</span>
            <el-switch
              v-model="menuStore.hamburger"
              @change="hamburger"
            />
          </div>
          <div class="setting-item">
            <span>{{ t('header.tab') }}</span>
            <el-switch
              v-model="menuStore.tabtag"
              @change="tabtag"
            />
          </div>
          <div class="setting-item">
            <span>{{ t('header.uniqueOpen') }}</span>
            <el-switch
              v-model="menuStore.uniqueOpen"
              @change="uniqueOpen"
            />
          </div>
          <div class="setting-item">
            <span>{{ t('header.footer') }}</span>
            <el-switch
              v-model="menuStore.footer"
              @change="changeFooter"
            />
          </div>
        </div>
      </div>
      
      <!-- 页面过渡 -->
      <div class="setting-section">
        <div class="section-title">
          {{ t('header.transition') }}
        </div>
        <div class="setting-list">
          <div class="setting-item">
            <span>{{ t('header.transitionEnable') }}</span>
            <el-switch
              v-model="menuStore.pageTransition"
              @change="pageTransition"
            />
          </div>
          <div class="setting-item">
            <span>{{ t('header.transitionType') }}</span>
            <el-select-v2
              v-model="menuStore.transitionName"
              :options="transitionOptions"
              style="width: 140px"
              size="small"
              @change="transitionName"
            />
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="setting-actions">
        <el-button
          class="action-btn"
          @click="clear"
        >
          <el-icon><Delete /></el-icon>
          {{ t('header.clearCache') }}
        </el-button>
        <el-button
          type="primary"
          class="action-btn"
          @click="resetTheme"
        >
          <el-icon><RefreshRight /></el-icon>
          {{ t('header.resetConfig') }}
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMenuStore } from '@/store/menu.ts'
import { useUserStore } from '@/store/user'
import { ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { toggleDarkMode } from '@/hooks/useTheme'
import { useAppKernel } from '@/app/injection'
import { deviceNamespace, userNamespace } from '@/modules/persistence/namespaces'
import {
  readDevicePreferences,
  writeDevicePreferences,
} from '@/modules/persistence/preferences'
import { Setting, Sunny, Moon, Check, Delete, RefreshRight } from '@element-plus/icons-vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])
const show = computed({ get: () => props.modelValue, set: (v: boolean) => emit('update:modelValue', v) })

const menuStore = useMenuStore()
const userStore = useUserStore()
const kernel = useAppKernel()
const route = useRoute()
const { t } = useI18n()
const isDark = ref(readDevicePreferences(kernel.persistence).theme === 'dark')
const customColor = ref(menuStore.systemColor)

const themeColors = computed(() => [
  { label: t('header.color.defaultBlue'), value: '#409EFF' },
  { label: t('header.color.techBlue'), value: '#3B82F6' },
  { label: t('header.color.proGray'), value: '#475569' },
  { label: t('header.color.bizGreen'), value: '#059669' },
  { label: t('header.color.steadyCyan'), value: '#0891B2' },
  { label: t('header.color.elegantPurple'), value: '#7C3AED' },
  { label: t('header.color.vibrantOrange'), value: '#EA580C' },
])

const transitionOptions = computed(() => [
  { label: t('header.transitionOption.fade'), value: 'fade' },
  { label: t('header.transitionOption.slideLeft'), value: 'slide-left' },
  { label: t('header.transitionOption.slideRight'), value: 'slide-right' },
  { label: t('header.transitionOption.zoom'), value: 'el-zoom-in-center' },
])

function onThemeChange(dark: boolean) {
  isDark.value = dark
  toggleDarkMode(dark)
  writeDevicePreferences(kernel.persistence, {
    ...readDevicePreferences(kernel.persistence),
    theme: dark ? 'dark' : 'light',
  })
  // 不再强制重置为默认颜色，保持用户选择的主题色
  // menuStore.applyDefaultSystemColor(dark)
  // 主题色由版本化设备偏好持久化。
  document.documentElement.style.setProperty('--el-color-primary', menuStore.systemColor)
}

function systemColor(color: string) {
  menuStore.changeSystemColor(color)
  document.documentElement.style.setProperty('--el-color-primary', color)
  customColor.value = color
}

function onCustomColor(color: string | null) {
  if (color) systemColor(color)
}

function breadcrumb(val: string | number | boolean) { menuStore.changeBreadcrumb(val as boolean) }
function hamburger(val: string | number | boolean) { menuStore.changeHamburger(val as boolean) }
function tabtag(val: string | number | boolean) { menuStore.changeTabtag(val as boolean) }
function uniqueOpen(val: string | number | boolean) { menuStore.changeUniqueOpen(val as boolean) }
function changeFooter(val: string | number | boolean) { menuStore.changeFooter(val as boolean) }
function pageTransition(val: string | number | boolean) { menuStore.changePageTransition(val as boolean) }
function transitionName(val: string) { menuStore.changeTransitionName(val) }

function syncCurrentRouteUiState() {
  const menuId = typeof route.meta.menuId === 'string' ? route.meta.menuId : ''
  menuStore.selectedMenu = menuId

  if (!menuId) return

  const currentMenu = userStore.permissionMap.get(menuId)
  if (currentMenu) {
    menuStore.selectMenu(currentMenu)
  }
}

function clear() {
  kernel.persistence.remove(deviceNamespace, 'preferences')
  kernel.persistence.remove(deviceNamespace, 'menu-ui')
  if (kernel.state.value.kind === 'ready') {
    kernel.persistence.clearNamespace(userNamespace(kernel.state.value.principal.userId))
  }
  menuStore.resetUiState()
  syncCurrentRouteUiState()
  toggleDarkMode(false)
  isDark.value = false
  document.documentElement.style.setProperty('--el-color-primary', menuStore.systemColor)
  customColor.value = menuStore.systemColor
  show.value = false
  menuStore.refreshCurrentPage()
  ElNotification.success({ title: t('header.tip'), message: t('header.cacheClearedMsg') })
}

function resetTheme() {
  onThemeChange(false)
  systemColor('#409EFF')
  menuStore.applyDefaultSystemColor(false)
  ElNotification.success({ title: t('header.tip'), message: t('header.configResetMsg') })
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
.custom-picker-wrapper { border: 2px dashed var(--el-border-color); background: var(--el-fill-color-lighter); :deep(.el-color-picker) { width: 100%; height: 100%; } :deep(.el-color-picker__trigger) { width: 100%; height: 100%; padding: 0; border: none; border-radius: 6px; } }
.setting-list { display: flex; flex-direction: column; gap: 4px; }
.setting-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--el-border-color-lighter); &:last-child { border-bottom: none; } span { font-size: 14px; color: var(--el-text-color-primary); } }
.setting-actions { display: flex; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--el-border-color-lighter); }
.action-btn { flex: 1; height: 40px; .el-icon { margin-right: 6px; } }
:deep(.el-drawer__header) { padding: 16px 20px; margin-bottom: 0; border-bottom: 1px solid var(--el-border-color-lighter); }
:deep(.el-drawer__body) { padding: 20px; }
</style>
