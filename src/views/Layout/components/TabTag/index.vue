<script setup lang="ts">
import {computed, ref, watch, nextTick, onMounted} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useMenuStore} from '@/store/menu';
import {useI18n} from 'vue-i18n'
import {resolveMenuLabel} from '@/utils/menuI18n'
import {
  Close,
  Refresh,
  CircleClose,
  FolderDelete,
  DArrowLeft,
  DArrowRight,
  Menu,
  Setting
} from '@element-plus/icons-vue'
import {ElScrollbar} from 'element-plus'

const menuStore = useMenuStore();
const router = useRouter();
const route = useRoute();
const {t} = useI18n()

const scrollPaneRef = ref<InstanceType<typeof ElScrollbar>>()
const tags = computed(() => menuStore.tabList);

const activePath = ref(route.path)
const currentIndex = computed(() => tags.value.findIndex(item => item.path === activePath.value))
const prevTag = computed(() => currentIndex.value > 0 ? tags.value[currentIndex.value - 1] : null)
const nextTag = computed(() => currentIndex.value >= 0 && currentIndex.value < tags.value.length - 1 ? tags.value[currentIndex.value + 1] : null)
const goPrevTag = () => {
  if (prevTag.value) router.push(prevTag.value.path)
}
const goNextTag = () => {
  if (nextTag.value) router.push(nextTag.value.path)
}

const moveToCurrentTag = () => {
  nextTick(() => {
  })
}
watch(() => route.path, (val) => {
  activePath.value = val;
  moveToCurrentTag()
}, {immediate: true})

function getTagLabel(tag: any) {
  return resolveMenuLabel(t, tag)
}

const isAffix = (tag: any) => tag.path === '/home'
const isActive = (tag: any) => tag.path === route.path
const visitTag = (tag: any) => router.push(tag.path)
const closeTag = (tag: any) => {
  menuStore.closeTag(tag);
  if (isActive(tag)) {
    const lastTag = tags.value[tags.value.length - 1];
    router.push(lastTag ? lastTag.path : '/')
  }
}
const handleScroll = (e: WheelEvent) => {
  const eventDelta = e.deltaY || -e.detail;
  scrollPaneRef.value?.setScrollLeft((scrollPaneRef.value.wrapRef as any).scrollLeft + eventDelta / 4)
}
const handleCommand = (command: string) => {
  switch (command) {
    case 'refresh':
      router.go(0);
      break;
    case 'closeOther':
      const current = tags.value.find(item => item.path === activePath.value);
      if (current) {
        const home = tags.value.find(item => item.path === '/home');
        const keepPaths = (home && home.path !== current.path) ? [home.path, current.path] : [current.path];
        const toClose = tags.value.filter(item => !keepPaths.includes(item.path));
        toClose.forEach(tag => menuStore.closeTag(tag))
      }
      break;
    case 'closeAll':
      menuStore.clearTabList();
      router.push('/home');
      break
  }
}

const visible = ref(false)
const top = ref(0)
const left = ref(0)
const selectedTag = ref<any>({})
const openMenu = (tag: any, e: MouseEvent) => {
  const menuMinWidth = 105;
  const leftVal = e.clientX;
  left.value = leftVal;
  top.value = e.clientY + 10;
  visible.value = true;
  selectedTag.value = tag
}
const closeMenu = () => {
  visible.value = false
}
watch(visible, (value) => {
  if (value) document.body.addEventListener('click', closeMenu); else document.body.removeEventListener('click', closeMenu)
})
const handleContextRefresh = () => {
  if (selectedTag.value.path === route.path) router.go(0); else router.push(selectedTag.value.path).then(() => {
    router.go(0)
  })
}
const handleContextClose = () => {
  closeTag(selectedTag.value)
}
const handleContextCloseOther = () => {
  const current = selectedTag.value;
  const home = tags.value.find(item => item.path === '/home');
  const keepPaths = (home && home.path !== current.path) ? [home.path, current.path] : [current.path];
  const toClose = tags.value.filter(item => !keepPaths.includes(item.path));
  toClose.forEach(tag => menuStore.closeTag(tag));
  router.push(current.path)
}
const handleContextCloseAll = () => {
  menuStore.clearTabList();
  router.push('/home')
}
</script>

<template>
  <div class="tags-view-container">
    <div class="tags-view-nav" @click="goPrevTag">
      <span class="action-item" :class="{ disabled: !prevTag }"><el-icon><DArrowLeft/></el-icon></span>
    </div>
    <div class="tags-view-wrapper">
      <el-scrollbar ref="scrollPaneRef" class="tags-view-scroll" @wheel.prevent="handleScroll">
        <div class="tags-inner">
          <div v-for="tag in tags" :key="tag.path" class="tags-view-item" :class="isActive(tag) ? 'active' : ''"
               @click="visitTag(tag)" @contextmenu.prevent="openMenu(tag, $event)">
            {{ getTagLabel(tag) }}
            <span v-if="!isAffix(tag)" class="close-icon-wrapper" @click.stop="closeTag(tag)"><el-icon
                class="close-icon"><Close/></el-icon></span>
          </div>
        </div>
      </el-scrollbar>
    </div>
    <div class="tags-view-nav right" @click="goNextTag">
      <span class="action-item" :class="{ disabled: !nextTag }"><el-icon><DArrowRight/></el-icon></span>
    </div>
    <div class="tags-view-actions">
      <span class="action-item" @click="router.go(0)"><el-icon><Refresh/></el-icon></span>
      <el-dropdown trigger="click" @command="handleCommand">
        <span class="action-item"><el-icon><Setting/></el-icon></span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="closeOther" :icon="CircleClose">关闭其他</el-dropdown-item>
            <el-dropdown-item command="closeAll" :icon="FolderDelete">关闭所有</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <ul v-show="visible" :style="{left:left+'px',top:top+'px'}" class="contextmenu">
      <li @click="handleContextRefresh">
        <el-icon>
          <Refresh/>
        </el-icon>
        刷新
      </li>
      <li v-if="!isAffix(selectedTag)" @click="handleContextClose">
        <el-icon>
          <Close/>
        </el-icon>
        关闭
      </li>
      <li @click="handleContextCloseOther">
        <el-icon>
          <CircleClose/>
        </el-icon>
        关闭其他
      </li>
      <li @click="handleContextCloseAll">
        <el-icon>
          <FolderDelete/>
        </el-icon>
        关闭所有
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.tags-view-container {
  height: 34px;
  width: 100%;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
  display: flex;
  align-items: center;
  position: relative
}

.tags-view-nav {
  position: relative;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--el-bg-color)
}

.tags-view-nav::after {
  content: '';
  position: absolute;
  top: 1px;
  right: 0;
  width: 1px;
  height: calc(100% - 2px);
  background-color: var(--el-border-color)
}

.tags-view-nav .action-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transition: all .3s
}

.tags-view-nav .action-item:hover:not(.disabled) {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light)
}

.tags-view-nav .disabled {
  pointer-events: none;
  color: var(--el-text-color-disabled)
}

.tags-view-nav.right::after {
  display: none
}

.tags-view-nav.right::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 0;
  width: 1px;
  height: calc(100% - 2px);
  background-color: var(--el-border-color)
}

.tags-view-wrapper {
  flex: 1;
  min-width: 0;
  height: 34px;
  overflow: hidden;
  background: var(--el-bg-color)
}

.tags-view-scroll {
  height: 100%
}

:deep(.el-scrollbar__view) {
  height: 100%
}

.tags-inner {
  display: flex;
  height: 100%;
  align-items: center;
  padding: 0 4px
}

.tags-view-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  height: 26px;
  line-height: 26px;
  border: 1px solid var(--el-border-color);
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  padding: 0 8px;
  font-size: 12px;
  margin-left: 4px;
  border-radius: 2px;
  transition: all .2s;
  flex-shrink: 0;
  white-space: nowrap
}

.tags-view-item:first-of-type {
  margin-left: 0
}

.tags-view-item:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5)
}

.tags-view-item:hover .close-icon-wrapper {
  width: 14px;
  margin-left: 5px;
  opacity: 1
}

.tags-view-item.active {
  background-color: var(--el-color-primary);
  color: var(--el-color-white);
  border-color: var(--el-color-primary)
}

.tags-view-item.active .close-icon {
  color: var(--el-color-white)
}

.close-icon-wrapper {
  width: 0;
  overflow: hidden;
  transition: all .3s cubic-bezier(0.645, 0.045, 0.355, 1);
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  height: 14px;
  margin-left: 0
}

.close-icon-wrapper:hover {
  background-color: var(--el-fill-color-dark);
  color: var(--el-color-white)
}

.tags-view-actions {
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color);
  position: relative
}

.tags-view-actions .action-item {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: background-color .2s ease;
  position: relative
}

.tags-view-actions .action-item::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 0;
  width: 1px;
  height: calc(100% - 2px);
  background-color: var(--el-border-color)
}

.tags-view-actions .action-item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary)
}

.contextmenu {
  margin: 0;
  background: var(--el-bg-color);
  z-index: 3000;
  position: fixed;
  list-style-type: none;
  padding: 5px 0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-primary);
  box-shadow: var(--el-box-shadow-light)
}

.contextmenu li {
  margin: 0;
  padding: 7px 16px;
  cursor: pointer;
  display: flex;
  align-items: center
}

.contextmenu li:hover {
  background: var(--el-fill-color-light)
}

.contextmenu .el-icon {
  margin-right: 5px
}
</style>

