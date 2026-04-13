<script setup lang="ts">
import { computed, defineAsyncComponent, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ArrowRight, Coin, Plus, Setting } from '@element-plus/icons-vue'
import { useIsMobile } from '@/hooks/useResponsive'
import { DIcon } from '@/components/DIcon'
import { AppDialog } from '@/components/AppDialog'
import { UsersQuickEntryApi } from '@/api/user/usersQuickEntry'
import { useUserStore } from '@/store/user'
import { HOME_MENU_ITEM } from '@/store/menu'
import type { PermissionMenuItem } from '@/types/user'

const Draggable = defineAsyncComponent(() => import('vuedraggable'))

const QUICK_ENTRY_DRAG_ANIMATION = 320
const QUICK_ENTRY_DRAG_EASING = 'cubic-bezier(0.2, 0.78, 0.24, 1)'
const QUICK_ENTRY_SWAP_THRESHOLD = 0.72
const QUICK_ENTRY_INVERTED_SWAP_THRESHOLD = 0.86

interface QuickEntryCardItem {
  id: number
  permissionId: number
  label: string
  icon: string
  path: string
  color: string
  background: string
}

interface MenuOption {
  value: string
  label: string
}

const entryColors = ['#409EFF', '#059669', '#D97706', '#DC2626']

const router = useRouter()
const userStore = useUserStore()
const isMobile = useIsMobile()
const { t, te, locale } = useI18n()

const isEditMode = shallowRef(false)
const addSelectVisible = shallowRef(false)
const selectedPermissionId = shallowRef('')
const isQuickEntryDragging = shallowRef(false)

const getEntryColor = (index: number) => entryColors[index % entryColors.length] ?? '#409EFF'

const resolveMenuLabel = (item: PermissionMenuItem) => {
  if (item.i18n_key && te(item.i18n_key)) {
    return t(item.i18n_key)
  }

  return item.label
}

const menuOptions = computed<MenuOption[]>(() => {
  const options: MenuOption[] = []
  const existingIds = new Set(userStore.quickEntry.map((item) => item.permission_id))
  const homePermissionId = Number(HOME_MENU_ITEM.index)

  const traverse = (items: PermissionMenuItem[], parentLabels: string[] = []) => {
    items.forEach((item) => {
      const currentLabel = resolveMenuLabel(item)
      const permissionId = Number(item.index)

      if (
        item.path &&
        Number.isFinite(permissionId) &&
        permissionId !== homePermissionId &&
        item.show_menu !== 0 &&
        item.show_menu !== false &&
        !existingIds.has(permissionId)
      ) {
        const labelTrail = parentLabels.length ? [...parentLabels, currentLabel] : [currentLabel]
        options.push({
          value: item.index,
          label: labelTrail.join(' / '),
        })
      }

      if (item.children?.length) {
        traverse(item.children, item.path ? parentLabels : [...parentLabels, currentLabel])
      }
    })
  }

  traverse(userStore.permissions)

  return options
})

const entries = computed<QuickEntryCardItem[]>(() => {
  return userStore.quickEntry
    .map((entry, index) => {
      const menu = userStore.permissionMap.get(String(entry.permission_id))
      if (!menu?.path) {
        return null
      }

      const color = getEntryColor(index)

      return {
        id: entry.id,
        permissionId: entry.permission_id,
        label: resolveMenuLabel(menu),
        icon: menu.icon || 'Document',
        path: menu.path,
        color,
        background: `${color}15`,
      }
    })
    .filter((item): item is QuickEntryCardItem => item !== null)
})

const dateLabel = computed(() => {
  const localeName = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'

  return new Intl.DateTimeFormat(localeName, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
})

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value

  if (!isEditMode.value) {
    addSelectVisible.value = false
  }
}

const onDragStart = () => {
  isQuickEntryDragging.value = true
}

const onDragEnd = async () => {
  isQuickEntryDragging.value = false

  const items = userStore.quickEntry.map((item, index) => ({
    id: item.id,
    sort: index + 1,
  }))

  try {
    await UsersQuickEntryApi.sort({ items })
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : t('common.fail')
    ElMessage.error(message)
  }
}

const handleAdd = async () => {
  if (!selectedPermissionId.value) {
    return
  }

  try {
    const response = await UsersQuickEntryApi.add({
      permission_id: Number(selectedPermissionId.value),
    })

    userStore.quickEntry.push({
      id: response.id,
      permission_id: Number(selectedPermissionId.value),
    })

    selectedPermissionId.value = ''
    addSelectVisible.value = false
    ElMessage.success(t('common.success'))
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : t('common.fail')
    ElMessage.error(message)
  }
}

const handleDelete = async (entryId: number) => {
  try {
    await UsersQuickEntryApi.del({ id: entryId })
    userStore.quickEntry = userStore.quickEntry.filter((item) => item.id !== entryId)
    ElMessage.success(t('common.success'))
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : t('common.fail')
    ElMessage.error(message)
  }
}

const goTo = (path: string) => {
  router.push(path)
}

const goToPersonal = () => {
  router.push({
    path: '/personal',
    query: { user_id: userStore.user_id },
  })
}

const goToWallet = () => {
  router.push('/wallet')
}
</script>

<template>
  <div class="home-page">
    <div class="welcome-banner">
      <div class="welcome-content">
        <el-avatar :src="userStore.avatar" :size="64" class="welcome-avatar" />

        <div class="welcome-text">
          <h2 class="welcome-title">{{ t('common.welcomeBack') }} {{ userStore.username }}</h2>
          <p class="welcome-subtitle">{{ dateLabel }}</p>
        </div>
      </div>

      <div class="welcome-actions">
        <el-button plain size="large" @click="goToPersonal">
          <el-icon><Setting /></el-icon>
          <span>{{ t('menu.personal') }}</span>
        </el-button>

        <el-button plain size="large" @click="goToWallet">
          <el-icon><Coin /></el-icon>
          <span>{{ t('menu.wallet') }}</span>
        </el-button>
      </div>
    </div>

    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title">{{ t('home.quickEntry') }}</h3>

        <el-button :type="isEditMode ? 'default' : 'primary'" @click="toggleEditMode">
          <el-icon><Setting /></el-icon>
          <span>{{ t('common.setting') }}</span>
        </el-button>
      </div>

      <Draggable
        v-if="isEditMode"
        v-model="userStore.quickEntry"
        item-key="id"
        :class="['quick-grid', { 'quick-grid--sorting': isQuickEntryDragging }]"
        :animation="QUICK_ENTRY_DRAG_ANIMATION"
        :swap-threshold="QUICK_ENTRY_SWAP_THRESHOLD"
        :invert-swap="true"
        :inverted-swap-threshold="QUICK_ENTRY_INVERTED_SWAP_THRESHOLD"
        :easing="QUICK_ENTRY_DRAG_EASING"
        :force-fallback="true"
        :fallback-on-body="true"
        :fallback-tolerance="3"
        ghost-class="drag-ghost"
        chosen-class="drag-chosen"
        drag-class="drag-active"
        fallback-class="drag-fallback"
        @start="onDragStart"
        @end="onDragEnd"
      >
        <template #item="{ element, index }">
          <div v-if="userStore.permissionMap.get(String(element.permission_id))" class="quick-card edit-mode">
            <div class="quick-card-inner">
              <div
                class="quick-icon"
                :style="{
                  backgroundColor: `${getEntryColor(index)}15`,
                  color: getEntryColor(index),
                }"
              >
                <DIcon
                  :icon="userStore.permissionMap.get(String(element.permission_id))?.icon || 'Document'"
                  :size="24"
                />
              </div>

              <div class="quick-content">
                <span class="quick-label">
                  {{
                    resolveMenuLabel(
                      userStore.permissionMap.get(String(element.permission_id)) as PermissionMenuItem
                    )
                  }}
                </span>

                <el-popconfirm :title="t('common.confirmDelete')" @confirm="handleDelete(element.id)">
                  <template #reference>
                    <el-button type="danger" text>{{ t('common.actions.del') }}</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="quick-card add-card" @click="addSelectVisible = true">
            <div class="quick-card-inner">
              <div class="quick-icon quick-icon--add">
                <el-icon :size="24"><Plus /></el-icon>
              </div>

              <div class="quick-content">
                <span class="quick-label">{{ t('common.actions.add') }}</span>
              </div>
            </div>
          </div>
        </template>
      </Draggable>

      <div v-else-if="entries.length" class="quick-grid">
        <div
          v-for="entry in entries"
          :key="entry.id"
          class="quick-card"
          @click="goTo(entry.path)"
        >
          <div class="quick-card-inner">
            <div
              class="quick-icon"
              :style="{ backgroundColor: entry.background, color: entry.color }"
            >
              <DIcon :icon="entry.icon" :size="24" />
            </div>

            <div class="quick-content">
              <span class="quick-label">{{ entry.label }}</span>
              <el-icon class="quick-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-else :description="t('home.noQuickEntry')" :image-size="80" />
    </div>

    <AppDialog
      v-model="addSelectVisible"
      :title="t('home.addQuickEntry')"
      :width="isMobile ? '90%' : '400px'"
    >
      <el-select-v2
        v-model="selectedPermissionId"
        :placeholder="t('common.pleaseSelect')"
        filterable
        :options="menuOptions"
        style="width: 100%"
      />

      <template #footer>
        <el-button @click="addSelectVisible = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :disabled="!selectedPermissionId" @click="handleAdd">
          {{ t('common.actions.confirm') }}
        </el-button>
      </template>
    </AppDialog>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  --quick-entry-soft: cubic-bezier(0.22, 0.61, 0.36, 1);
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 4px;
}

.welcome-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 32px;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  border-radius: 16px;
  color: #fff;
  box-shadow: 0 8px 24px rgba(30, 58, 138, 0.25);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    padding: 24px;
  }
}

.welcome-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.welcome-avatar {
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.welcome-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 20px;
  }
}

.welcome-subtitle {
  margin: 0;
  font-size: 14px;
  opacity: 0.92;
}

.welcome-actions {
  display: flex;
  align-items: center;
  gap: 12px;

  .el-button + .el-button {
    margin-left: 0;
  }

  .el-button {
    min-width: 132px;
    backdrop-filter: blur(10px);
  }

  .el-button--default {
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: #fff;

    &:hover {
      background: rgba(255, 255, 255, 0.24);
      border-color: rgba(255, 255, 255, 0.42);
      color: #fff;
    }
  }

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}

.section-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.quick-card {
  position: relative;
  padding: 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  cursor: pointer;
  overflow: visible;
  will-change: transform, box-shadow, opacity;
  transition:
    transform 300ms var(--quick-entry-soft),
    box-shadow 220ms ease,
    border-color 220ms ease,
    background-color 220ms ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
    transform: translateY(-4px);

    .quick-arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &.edit-mode {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }

  &.add-card {
    border-style: dashed;
  }
}

.quick-card-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  transform-origin: center;
  will-change: transform;
  transition:
    transform 240ms var(--quick-entry-soft),
    opacity 180ms ease;
}

.quick-grid--sorting .quick-card.add-card {
  opacity: 0.92;
}

.drag-ghost {
  background: rgba(64, 158, 255, 0.04) !important;
  border-color: transparent !important;
  box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.08);
}

.drag-ghost .quick-card-inner {
  opacity: 0;
}

.drag-chosen,
.drag-active,
.drag-fallback {
  z-index: 4;
  border-color: rgba(64, 158, 255, 0.32);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(245, 248, 255, 0.96));
  box-shadow: 0 22px 44px rgba(15, 23, 42, 0.14), 0 10px 20px rgba(37, 99, 235, 0.14);
  cursor: grabbing !important;
}

.drag-chosen .quick-card-inner,
.drag-active .quick-card-inner,
.drag-fallback .quick-card-inner {
  transform: scale(1.04) rotate(-1.5deg);
}

.drag-fallback {
  opacity: 0.98;
}

.quick-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.quick-icon--add {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.quick-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.quick-label {
  min-width: 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.quick-arrow {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  opacity: 0;
  transform: translateX(-8px);
  transition:
    transform 180ms var(--quick-entry-soft),
    opacity 160ms ease;
}
</style>
