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
    <button
      type="button"
      class="tags-nav"
      :class="{ disabled: !prevTag }"
      @click="goPrevTag"
    >
      <el-icon><DArrowLeft /></el-icon>
    </button>

    <div class="tags-wrapper">
      <el-scrollbar
        ref="scrollPaneRef"
        class="tags-scroll"
        @wheel.prevent="handleScroll"
      >
        <div
          ref="tagsInnerRef"
          class="tags-inner"
        >
          <TransitionGroup
            name="tag"
            tag="div"
            class="tags-list"
          >
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
              <span
                v-if="isActive(tag)"
                class="tag-dot"
              />
              <span class="tag-label">{{ getTagLabel(tag) }}</span>
              <span
                v-if="!isAffix(tag)"
                class="tag-close"
                @click.stop="closeTag(tag)"
              >
                <el-icon :size="12"><Close /></el-icon>
              </span>
            </div>
          </TransitionGroup>
        </div>
      </el-scrollbar>
    </div>

    <button
      type="button"
      class="tags-nav"
      :class="{ disabled: !nextTag }"
      @click="goNextTag"
    >
      <el-icon><DArrowRight /></el-icon>
    </button>

    <el-dropdown
      trigger="click"
      @command="handleCommand"
    >
      <button
        type="button"
        class="tags-nav tags-action"
      >
        <el-icon><Setting /></el-icon>
      </button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            command="refresh"
            :icon="Refresh"
          >
            {{ t('tabTag.refresh') }}
          </el-dropdown-item>
          <el-dropdown-item
            command="fullscreen"
            :icon="FullScreen"
          >
            {{ menuStore.contentFullscreen ? t('tabTag.exitFullscreen') : t('tabTag.fullscreen') }}
          </el-dropdown-item>
          <el-dropdown-item
            command="closeOther"
            :icon="CircleClose"
          >
            {{ t('tabTag.closeOther') }}
          </el-dropdown-item>
          <el-dropdown-item
            command="closeAll"
            :icon="FolderDelete"
          >
            {{ t('tabTag.closeAll') }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <ul
      v-show="visible"
      ref="contextMenuRef"
      class="context-menu"
      :style="{ left: `${left}px`, top: `${top}px` }"
    >
      <li @click="handleContextRefresh">
        <el-icon><Refresh /></el-icon>{{ t('tabTag.refresh') }}
      </li>
      <li
        v-if="selectedTag && !isAffix(selectedTag)"
        @click="handleContextClose"
      >
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

<style lang="scss" scoped src="./styles.scss"></style>
