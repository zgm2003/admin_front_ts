<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMenuStore } from '@/store/menu'
import { useI18n } from 'vue-i18n'
import { resolveMenuLabel } from '@/utils/menuI18n'
import { CircleClose, Close, DArrowLeft, DArrowRight, FolderDelete, Refresh, Setting } from '@element-plus/icons-vue'
import { ElScrollbar } from 'element-plus'

const menuStore = useMenuStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const scrollPaneRef = ref<InstanceType<typeof ElScrollbar>>()
type TagItem = { path: string; label?: string; i18n_key?: string; name?: string }
const tags = computed(() => menuStore.tabList as TagItem[])

const activePath = ref(route.path)
const currentIndex = computed(() => tags.value.findIndex(item => item.path === activePath.value))
const prevTag = computed(() => currentIndex.value > 0 ? tags.value[currentIndex.value - 1] : null)
const nextTag = computed(() => currentIndex.value >= 0 && currentIndex.value < tags.value.length - 1 ? tags.value[currentIndex.value + 1] : null)

const goPrevTag = () => { if (prevTag.value) router.push(prevTag.value.path) }
const goNextTag = () => { if (nextTag.value) router.push(nextTag.value.path) }

watch(() => route.path, (val) => {
  activePath.value = val
  nextTick(() => {})
}, { immediate: true })

function getTagLabel(tag: any) {
  return resolveMenuLabel(t, tag)
}

const isAffix = (tag: any) => tag.path === '/home'
const isActive = (tag: any) => tag.path === route.path
const visitTag = (tag: any) => router.push(tag.path)

const closeTag = (tag: any) => {
  menuStore.closeTag(tag)
  if (isActive(tag)) {
    const lastTag = tags.value[tags.value.length - 1]
    router.push(lastTag ? lastTag.path : '/')
  }
}

const handleScroll = (e: WheelEvent) => {
  const eventDelta = e.deltaY || -e.detail
  scrollPaneRef.value?.setScrollLeft((scrollPaneRef.value.wrapRef as any).scrollLeft + eventDelta / 4)
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'refresh':
      router.go(0)
      break
    case 'closeOther':
      const current = tags.value.find(item => item.path === activePath.value)
      if (current) {
        const home = tags.value.find(item => item.path === '/home')
        const keepPaths = (home && home.path !== current.path) ? [home.path, current.path] : [current.path]
        tags.value.filter(item => !keepPaths.includes(item.path)).forEach(tag => menuStore.closeTag(tag))
      }
      break
    case 'closeAll':
      menuStore.clearTabList()
      router.push('/home')
      break
  }
}

// 右键菜单
const visible = ref(false)
const top = ref(0)
const left = ref(0)
const selectedTag = ref<any>({})

const openMenu = (tag: TagItem, e: MouseEvent) => {
  left.value = e.clientX
  top.value = e.clientY + 10
  visible.value = true
  selectedTag.value = tag
}

const closeMenu = () => { visible.value = false }

watch(visible, (value) => {
  if (value) document.body.addEventListener('click', closeMenu)
  else document.body.removeEventListener('click', closeMenu)
})

const handleContextRefresh = () => {
  if (selectedTag.value.path === route.path) router.go(0)
  else router.push(selectedTag.value.path).then(() => router.go(0))
}

const handleContextClose = () => closeTag(selectedTag.value)

const handleContextCloseOther = () => {
  const current = selectedTag.value
  const home = tags.value.find(item => item.path === '/home')
  const keepPaths = (home && home.path !== current.path) ? [home.path, current.path] : [current.path]
  tags.value.filter(item => !keepPaths.includes(item.path)).forEach(tag => menuStore.closeTag(tag))
  router.push(current.path)
}

const handleContextCloseAll = () => {
  menuStore.clearTabList()
  router.push('/home')
}
</script>

<template>
  <div class="tags-view">
    <!-- 左箭头 -->
    <button class="tags-nav" :class="{ disabled: !prevTag }" @click="goPrevTag">
      <el-icon><DArrowLeft /></el-icon>
    </button>
    
    <!-- 标签列表 -->
    <div class="tags-wrapper">
      <el-scrollbar ref="scrollPaneRef" class="tags-scroll" @wheel.prevent="handleScroll">
        <div class="tags-inner">
          <div 
            v-for="tag in tags" 
            :key="tag.path" 
            class="tag-item" 
            :class="{ active: isActive(tag) }"
            @click="visitTag(tag)" 
            @contextmenu.prevent="openMenu(tag, $event)"
          >
            <span class="tag-dot" v-if="isActive(tag)"></span>
            <span class="tag-label">{{ getTagLabel(tag) }}</span>
            <span v-if="!isAffix(tag)" class="tag-close" @click.stop="closeTag(tag)">
              <el-icon :size="12"><Close /></el-icon>
            </span>
          </div>
        </div>
      </el-scrollbar>
    </div>
    
    <!-- 右箭头 -->
    <button class="tags-nav" :class="{ disabled: !nextTag }" @click="goNextTag">
      <el-icon><DArrowRight /></el-icon>
    </button>
    
    <!-- 操作下拉 -->
    <el-dropdown trigger="click" @command="handleCommand">
      <button class="tags-nav tags-action">
        <el-icon><Setting /></el-icon>
      </button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="refresh" :icon="Refresh">刷新当前</el-dropdown-item>
          <el-dropdown-item command="closeOther" :icon="CircleClose">关闭其他</el-dropdown-item>
          <el-dropdown-item command="closeAll" :icon="FolderDelete">关闭所有</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    
    <!-- 右键菜单 -->
    <ul v-show="visible" class="context-menu" :style="{ left: left + 'px', top: top + 'px' }">
      <li @click="handleContextRefresh">
        <el-icon><Refresh /></el-icon>刷新
      </li>
      <li v-if="!isAffix(selectedTag)" @click="handleContextClose">
        <el-icon><Close /></el-icon>关闭
      </li>
      <li @click="handleContextCloseOther">
        <el-icon><CircleClose /></el-icon>关闭其他
      </li>
      <li @click="handleContextCloseAll">
        <el-icon><FolderDelete /></el-icon>关闭所有
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.tags-view { display: flex; align-items: center; height: 40px; background: var(--el-bg-color); border-bottom: 1px solid var(--el-border-color-lighter); padding: 0 4px; }
.tags-nav { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; background: transparent; color: var(--el-text-color-regular); cursor: pointer; border-radius: 6px; transition: all 0.15s; flex-shrink: 0; &:hover:not(.disabled) { background: var(--el-fill-color-light); color: var(--el-text-color-primary); } &.disabled { opacity: 0.4; cursor: not-allowed; } }
.tags-action { border-left: 1px solid var(--el-border-color-lighter); border-radius: 0; margin-left: 4px; }
.tags-wrapper { flex: 1; min-width: 0; height: 100%; overflow: hidden; }
.tags-scroll { height: 100%; }
:deep(.el-scrollbar__view) { height: 100%; }
.tags-inner { display: flex; align-items: center; height: 100%; gap: 6px; padding: 0 4px; }
.tag-item { display: inline-flex; align-items: center; height: 28px; padding: 0 12px; font-size: 13px; color: var(--el-text-color-regular); background: var(--el-fill-color-lighter); border-radius: 6px; cursor: pointer; transition: all 0.15s; flex-shrink: 0; white-space: nowrap; gap: 6px; &:hover { color: var(--el-text-color-primary); background: var(--el-fill-color-light); .tag-close { opacity: 1; } } &.active { color: var(--el-color-primary); background: var(--el-color-primary-light-9); font-weight: 500; } }
.tag-dot { width: 6px; height: 6px; background: var(--el-color-primary); border-radius: 50%; }
.tag-close { display: flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 4px; opacity: 0; transition: all 0.15s; margin-left: 2px; margin-right: -4px; &:hover { background: rgba(0, 0, 0, 0.1); } }
.active .tag-close { opacity: 1; }
.context-menu { position: fixed; z-index: 3000; list-style: none; margin: 0; padding: 6px 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; box-shadow: var(--el-box-shadow-light); min-width: 120px; li { display: flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 13px; color: var(--el-text-color-primary); cursor: pointer; transition: background 0.15s; &:hover { background: var(--el-fill-color-light); } .el-icon { color: var(--el-text-color-regular); } } }
</style>
