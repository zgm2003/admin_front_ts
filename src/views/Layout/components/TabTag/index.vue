<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { refreshCurrentRoute } from '@/router'
import { useRoute, useRouter } from 'vue-router'
import { useMenuStore } from '@/store/menu'
import { useI18n } from 'vue-i18n'
import { resolveMenuLabel } from '@/views/Layout/utils/menuLabel'
import { CircleClose, Close, DArrowLeft, DArrowRight, FolderDelete, FullScreen, Refresh, Setting } from '@element-plus/icons-vue'
import { ElScrollbar } from 'element-plus'
import { onClickOutside } from '@vueuse/core'

type TagItem = {
  path: string
  index: string
  label?: string
  i18n_key?: string
  name?: string
}

const menuStore = useMenuStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const scrollPaneRef = ref<InstanceType<typeof ElScrollbar>>()
const tagsInnerRef = ref<HTMLElement | null>(null)
const visible = ref(false)
const top = ref(0)
const left = ref(0)
const selectedTag = ref<TagItem | null>(null)
const contextMenuRef = ref<HTMLElement | null>(null)
const activePath = ref(route.path)

const tags = computed(() => menuStore.tabList as TagItem[])
const currentIndex = computed(() => tags.value.findIndex(item => item.path === activePath.value))
const prevTag = computed(() => currentIndex.value > 0 ? tags.value[currentIndex.value - 1] : null)
const nextTag = computed(() => currentIndex.value >= 0 && currentIndex.value < tags.value.length - 1 ? tags.value[currentIndex.value + 1] : null)
const tagSignature = computed(() => tags.value.map(item => item.path).join('|'))

const goPrevTag = () => { if (prevTag.value) router.push(prevTag.value.path) }
const goNextTag = () => { if (nextTag.value) router.push(nextTag.value.path) }

function getTagLabel(tag: TagItem) {
  return resolveMenuLabel(t, tag)
}

function isAffix(tag?: TagItem | null) {
  return tag?.path === '/home'
}

function isActive(tag: TagItem) {
  return tag.path === route.path
}

function visitTag(tag: TagItem) {
  router.push(tag.path)
}

function closeTag(tag: TagItem) {
  menuStore.closeTag(tag)
  if (isActive(tag)) {
    const lastTag = tags.value[tags.value.length - 1]
    router.push(lastTag ? lastTag.path : '/home')
  }
}

function scrollActiveTagIntoView() {
  const activeTag = tagsInnerRef.value?.querySelector<HTMLElement>('.tag-item.active')
  if (!activeTag) return

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  activeTag.scrollIntoView({
    block: 'nearest',
    inline: 'center',
    behavior: reduceMotion ? 'auto' : 'smooth'
  })
}

const handleScroll = (e: WheelEvent) => {
  const wrapRef = scrollPaneRef.value?.wrapRef as HTMLElement | undefined
  if (!wrapRef) return
  const delta = e.deltaY || -e.detail
  scrollPaneRef.value?.setScrollLeft(wrapRef.scrollLeft + delta / 4)
}

const handleCommand = async (command: string) => {
  switch (command) {
    case 'refresh':
      await refreshCurrentRoute()
      break
    case 'fullscreen':
      menuStore.toggleContentFullscreen()
      break
    case 'closeOther': {
      const current = tags.value.find(item => item.path === activePath.value)
      if (!current) break
      const home = tags.value.find(item => item.path === '/home')
      const keepPaths = home && home.path !== current.path ? [home.path, current.path] : [current.path]
      tags.value.filter(item => !keepPaths.includes(item.path)).forEach(tag => menuStore.closeTag(tag))
      break
    }
    case 'closeAll':
      menuStore.clearTabList()
      router.push('/home')
      break
  }
}

const openMenu = (tag: TagItem, e: MouseEvent) => {
  left.value = e.clientX
  top.value = e.clientY + 10
  visible.value = true
  selectedTag.value = tag
}

const closeMenu = () => {
  visible.value = false
}

onClickOutside(contextMenuRef, () => {
  if (visible.value) closeMenu()
})

const handleContextRefresh = async () => {
  if (!selectedTag.value) return
  closeMenu()
  if (selectedTag.value.path === route.path) {
    await refreshCurrentRoute()
  } else {
    await router.push(selectedTag.value.path)
    await refreshCurrentRoute()
  }
}

const handleContextClose = () => {
  if (!selectedTag.value) return
  closeMenu()
  closeTag(selectedTag.value)
}

const handleContextCloseOther = () => {
  if (!selectedTag.value) return
  closeMenu()
  const current = selectedTag.value
  const home = tags.value.find(item => item.path === '/home')
  const keepPaths = home && home.path !== current.path ? [home.path, current.path] : [current.path]
  tags.value.filter(item => !keepPaths.includes(item.path)).forEach(tag => menuStore.closeTag(tag))
  router.push(current.path)
}

const handleContextCloseAll = () => {
  closeMenu()
  menuStore.clearTabList()
  router.push('/home')
}

watch(() => route.path, (value) => {
  activePath.value = value
  nextTick(scrollActiveTagIntoView)
}, { immediate: true })

watch(tagSignature, () => {
  nextTick(scrollActiveTagIntoView)
})
</script>

<template>
  <div class="tags-view">
    <button type="button" class="tags-nav" :class="{ disabled: !prevTag }" @click="goPrevTag">
      <el-icon><DArrowLeft /></el-icon>
    </button>

    <div class="tags-wrapper">
      <el-scrollbar ref="scrollPaneRef" class="tags-scroll" @wheel.prevent="handleScroll">
        <div ref="tagsInnerRef" class="tags-inner">
          <TransitionGroup name="tag" tag="div" class="tags-list">
            <div
              v-for="tag in tags"
              :key="tag.path"
              class="tag-item"
              :class="{ active: isActive(tag) }"
              :data-path="tag.path"
              tabindex="0"
              role="button"
              :aria-current="isActive(tag) ? 'page' : undefined"
              @click="visitTag(tag)"
              @keydown.enter.prevent="visitTag(tag)"
              @keydown.space.prevent="visitTag(tag)"
              @contextmenu.prevent="openMenu(tag, $event)"
            >
              <span class="tag-dot" v-if="isActive(tag)"></span>
              <span class="tag-label">{{ getTagLabel(tag) }}</span>
              <span v-if="!isAffix(tag)" class="tag-close" @click.stop="closeTag(tag)">
                <el-icon :size="12"><Close /></el-icon>
              </span>
            </div>
          </TransitionGroup>
        </div>
      </el-scrollbar>
    </div>

    <button type="button" class="tags-nav" :class="{ disabled: !nextTag }" @click="goNextTag">
      <el-icon><DArrowRight /></el-icon>
    </button>

    <el-dropdown trigger="click" @command="handleCommand">
      <button type="button" class="tags-nav tags-action">
        <el-icon><Setting /></el-icon>
      </button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="refresh" :icon="Refresh">{{ t('tabTag.refresh') }}</el-dropdown-item>
          <el-dropdown-item command="fullscreen" :icon="FullScreen">{{ menuStore.contentFullscreen ? t('tabTag.exitFullscreen') : t('tabTag.fullscreen') }}</el-dropdown-item>
          <el-dropdown-item command="closeOther" :icon="CircleClose">{{ t('tabTag.closeOther') }}</el-dropdown-item>
          <el-dropdown-item command="closeAll" :icon="FolderDelete">{{ t('tabTag.closeAll') }}</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <ul ref="contextMenuRef" v-show="visible" class="context-menu" :style="{ left: `${left}px`, top: `${top}px` }">
      <li @click="handleContextRefresh">
        <el-icon><Refresh /></el-icon>{{ t('tabTag.refresh') }}
      </li>
      <li v-if="selectedTag && !isAffix(selectedTag)" @click="handleContextClose">
        <el-icon><Close /></el-icon>{{ t('tabTag.close') }}
      </li>
      <li @click="handleContextCloseOther">
        <el-icon><CircleClose /></el-icon>{{ t('tabTag.closeOther') }}
      </li>
      <li @click="handleContextCloseAll">
        <el-icon><FolderDelete /></el-icon>{{ t('tabTag.closeAll') }}
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.tags-view {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 40px;
  padding: 0 10px 0 8px;
  background: transparent;
}

.tags-nav {
  position: relative;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font: inherit;
  appearance: none;
  border: 1px solid var(--shell-line);
  border-radius: 9px;
  background: var(--shell-panel);
  color: var(--shell-text-soft);
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: all var(--app-motion-fast) var(--app-ease-standard);

  &:hover:not(.disabled) {
    color: var(--shell-text-strong);
    background: var(--shell-hover);
    border-color: var(--shell-line-strong);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--shell-panel-strong), 0 0 0 4px var(--shell-focus-ring);
  }

  &.disabled {
    opacity: 0.42;
    cursor: not-allowed;
  }
}

.tags-action {
  margin-left: 6px;

  &::before {
    content: '';
    position: absolute;
    left: -7px;
    top: 6px;
    bottom: 6px;
    width: 1px;
    background: var(--shell-line);
  }
}

.tags-wrapper {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.tags-scroll {
  height: 100%;
}

:deep(.el-scrollbar__view) {
  height: 100%;
}

.tags-inner {
  height: 100%;
  display: flex;
  align-items: center;
}

.tags-list {
  position: relative;
  min-width: max-content;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 2px;
}

.tag-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: var(--shell-text-soft);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: all var(--app-motion-fast) var(--app-ease-standard);

  &:hover {
    color: var(--shell-text-strong);
    background: var(--shell-hover);
    border-color: var(--shell-line);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--shell-panel-strong), 0 0 0 4px var(--shell-focus-ring);
  }

  &.active {
    color: var(--shell-text-strong);
    background: var(--shell-panel-strong);
    border-color: var(--shell-line);
  }
}

.tag-dot {
  width: 5px;
  height: 5px;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--el-color-primary);
}

.tag-label {
  max-width: 144px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 500;
}

.tag-close {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -4px;
  border-radius: 6px;
  color: currentColor;
  opacity: 0;
  transform: scale(0.88);
  transition: all var(--app-motion-fast) var(--app-ease-standard);

  &:hover {
    background: rgba(148, 163, 184, 0.12);
  }
}

.tag-item:hover .tag-close,
.tag-item.active .tag-close {
  opacity: 1;
  transform: scale(1);
}

.context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 132px;
  margin: 0;
  padding: 8px 0;
  list-style: none;
  background: var(--shell-panel-strong);
  border: 1px solid var(--shell-line);
  border-radius: 12px;
  box-shadow: var(--shell-shadow-soft);

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 16px;
    font-size: 13px;
    color: var(--el-text-color-primary);
    cursor: pointer;
    transition: background-color var(--app-motion-fast) var(--app-ease-standard);

    &:hover {
      background: var(--shell-hover);
    }

    .el-icon {
      color: var(--el-text-color-regular);
    }
  }
}

.tag-enter-active,
.tag-leave-active,
.tag-move {
  transition:
    transform var(--app-motion-base) var(--app-ease-emphasized),
    opacity var(--app-motion-fast) var(--app-ease-standard);
}

.tag-enter-from,
.tag-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

.tag-leave-active {
  position: absolute;
  pointer-events: none;
}

@media (max-width: 768px) {
  .tags-view {
    height: 34px;
    padding-inline: 6px;
  }

  .tags-nav {
    width: 26px;
    height: 26px;
    border-radius: 7px;
  }

  .tags-action {
    margin-left: 4px;

    &::before {
      left: -5px;
    }
  }

  .tags-list {
    gap: 3px;
    padding-inline: 0;
  }

  .tag-item {
    height: 26px;
    padding: 0 10px;
    border-radius: 7px;
  }

  .tag-label {
    max-width: 88px;
    font-size: 12px;
  }

  .tag-dot {
    width: 4px;
    height: 4px;
  }
}
</style>
