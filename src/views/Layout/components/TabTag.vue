<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMenuStore } from '@/store/menu';
import { useI18n } from 'vue-i18n'
import { resolveMenuLabel } from '@/utils/menuI18n'
import { Close, Refresh, CircleClose, FolderDelete, DArrowLeft, DArrowRight, Menu } from '@element-plus/icons-vue'
import { ElScrollbar } from 'element-plus'

const menuStore = useMenuStore();
const router = useRouter();
const route = useRoute();
const { t } = useI18n()

const scrollPaneRef = ref<InstanceType<typeof ElScrollbar>>()
const tags = computed(() => menuStore.tabList);

const activePath = ref(route.path)
const currentIndex = computed(() => tags.value.findIndex(item => item.path === activePath.value))
const prevTag = computed(() => currentIndex.value > 0 ? tags.value[currentIndex.value - 1] : null)
const nextTag = computed(() => currentIndex.value >= 0 && currentIndex.value < tags.value.length - 1 ? tags.value[currentIndex.value + 1] : null)
const goPrevTag = () => { if (prevTag.value) router.push(prevTag.value.path) }
const goNextTag = () => { if (nextTag.value) router.push(nextTag.value.path) }

const moveToCurrentTag = () => {
  nextTick(() => {
    const scrollWrap = scrollPaneRef.value?.wrapRef
    const container = scrollPaneRef.value?.$el
    if (!scrollWrap || !container) return
    
    // Simple logic: if active tag is not visible, scroll to it
    // For a perfect implementation, we need refs to each tag item.
    // Simplified: scroll active into view logic is handled by browser if we use anchor links, 
    // but here we use div. Let's assume user scrolls manually or we implement basic auto-scroll later if needed.
    // Adding a simple "scroll to active" logic requires refs map.
  })
}

watch(() => route.path, (val) => {
  activePath.value = val
  moveToCurrentTag()
}, { immediate: true })

function getTagLabel(tag: any) { return resolveMenuLabel(t, tag) }

const isAffix = (tag: any) => {
  return tag.path === '/home'
}

const isActive = (tag: any) => {
  return tag.path === route.path
}

const visitTag = (tag: any) => {
  router.push(tag.path)
}

const closeTag = (tag: any) => {
  menuStore.closeTag(tag)
  if (isActive(tag)) {
    const lastTag = tags.value[tags.value.length - 1]
    if (lastTag) {
      router.push(lastTag.path)
    } else {
      router.push('/')
    }
  }
}

const handleScroll = (e: WheelEvent) => {
  const eventDelta = e.deltaY || -e.detail;
  if (scrollPaneRef.value) {
    scrollPaneRef.value.setScrollLeft(scrollPaneRef.value.wrapRef!.scrollLeft + eventDelta / 4)
  }
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'refresh':
      router.go(0)
      break
    case 'closeOther':
      const current = tags.value.find(item => item.path === activePath.value)
      if (current) {
        // Construct new list: home + current
        const home = tags.value.find(item => item.path === '/home')
        let newList = []
        if (home && home.path !== current.path) {
          newList = [home, current]
        } else {
          newList = [current]
        }
        // Direct manipulation for store (assuming store allows it or we should add action)
        // Since we used closeTag before, let's just set the list if possible. 
        // Looking at previous code, we might need a clearOthers action or manually close loop.
        // Simpler: filter in component and save?
        // Ideally store should provide `setTabList`. Assuming `menuStore.tabList` is state, we can try modifying or use `menuStore.$patch`.
        // Let's use a safe way:
        const keepPaths = newList.map(i => i.path)
        // Iterate backwards to avoid index issues, close those not in keepPaths
        const toClose = tags.value.filter(item => !keepPaths.includes(item.path))
        toClose.forEach(tag => menuStore.closeTag(tag))
      }
      break
    case 'closeAll':
      menuStore.clearTabList()
      router.push('/home')
      break
  }
}

// Context Menu Logic
const visible = ref(false)
const top = ref(0)
const left = ref(0)
const selectedTag = ref<any>({})

const openMenu = (tag: any, e: MouseEvent) => {
  const menuMinWidth = 105
  const offsetLeft = (e.target as HTMLElement).getBoundingClientRect().left // container left
  const offsetWidth = (e.target as HTMLElement).offsetWidth // container width
  const maxLeft = offsetWidth - menuMinWidth
  const leftVal = e.clientX 
  
  left.value = leftVal
  top.value = e.clientY + 10 // slightly below mouse
  visible.value = true
  selectedTag.value = tag
}

const closeMenu = () => {
  visible.value = false
}

watch(visible, (value) => {
  if (value) {
    document.body.addEventListener('click', closeMenu)
  } else {
    document.body.removeEventListener('click', closeMenu)
  }
})

const handleContextRefresh = () => {
  if (selectedTag.value.path === route.path) {
    router.go(0)
  } else {
    router.push(selectedTag.value.path).then(() => {
       router.go(0)
    })
  }
}

const handleContextClose = () => {
  closeTag(selectedTag.value)
}

const handleContextCloseOther = () => {
  const current = selectedTag.value
  const home = tags.value.find(item => item.path === '/home')
  const keepPaths = (home && home.path !== current.path) ? [home.path, current.path] : [current.path]
  const toClose = tags.value.filter(item => !keepPaths.includes(item.path))
  toClose.forEach(tag => menuStore.closeTag(tag))
  router.push(current.path)
}

const handleContextCloseAll = () => {
  menuStore.clearTabList()
  router.push('/home')
}

</script>

<template>
  <div class="tags-view-container">
    <div class="tags-view-nav">
      <span class="action-item" :class="{ disabled: !prevTag }" @click="goPrevTag"><el-icon><DArrowLeft /></el-icon></span>
    </div>
    <el-scrollbar 
      ref="scrollPaneRef" 
      class="tags-view-wrapper" 
      @wheel.prevent="handleScroll"
    >
      <div class="tags-inner">
        <div
          v-for="tag in tags"
          :key="tag.path"
          class="tags-view-item"
          :class="isActive(tag) ? 'active' : ''"
          @click="visitTag(tag)"
          @contextmenu.prevent="openMenu(tag, $event)"
        >
          {{ getTagLabel(tag) }}
          <span v-if="!isAffix(tag)" class="close-icon-wrapper" @click.stop="closeTag(tag)">
            <el-icon class="close-icon"><Close /></el-icon>
          </span>
        </div>
      </div>
    </el-scrollbar>
    <div class="tags-view-nav right">
      <span class="action-item" :class="{ disabled: !nextTag }" @click="goNextTag"><el-icon><DArrowRight /></el-icon></span>
    </div>
    <div class="tags-view-actions">
      <span class="action-item" @click="router.go(0)"><el-icon><Refresh /></el-icon></span>
      <el-dropdown trigger="click" @command="handleCommand">
        <span class="action-item">
          <el-icon><Menu /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="closeOther" :icon="CircleClose">关闭其他</el-dropdown-item>
            <el-dropdown-item command="closeAll" :icon="FolderDelete">关闭所有</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- Context Menu -->
    <ul v-show="visible" :style="{left:left+'px',top:top+'px'}" class="contextmenu">
      <li @click="handleContextRefresh"><el-icon><Refresh /></el-icon> 刷新</li>
      <li v-if="!isAffix(selectedTag)" @click="handleContextClose"><el-icon><Close /></el-icon> 关闭</li>
      <li @click="handleContextCloseOther"><el-icon><CircleClose /></el-icon> 关闭其他</li>
      <li @click="handleContextCloseAll"><el-icon><FolderDelete /></el-icon> 关闭所有</li>
    </ul>
  </div>
</template>

<style lang="less" scoped>
.tags-view-container {
  height: 34px;
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #d8dce5;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.12), 0 0 3px 0 rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  
  .tags-view-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    .disabled { pointer-events: none; color: #c0c4cc }
    &.right { }
  }
  
  .tags-view-wrapper {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    
    .tags-inner {
      display: flex;
      padding: 0 10px;
      height: 34px;
      align-items: center;
    }

    .tags-view-item {
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      height: 26px;
      line-height: 26px;
      border: 1px solid #d8dce5;
      color: #495060;
      background: #fff;
      padding: 0 8px;
      font-size: 12px;
      margin-right: 5px;
      border-radius: 2px;
      transition: all 0.2s;

      &:hover {
        color: var(--el-color-primary);
        border-color: var(--el-color-primary-light-5);
        
        .close-icon-wrapper {
          width: 14px;
          margin-left: 5px;
          opacity: 1;
        }
      }

      &.active {
        background-color: var(--el-color-primary);
        color: #fff;
        border-color: var(--el-color-primary);
        
        &::before {
          content: '';
          background: #fff;
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: relative;
          margin-right: 5px;
        }
        
        .close-icon-wrapper {
           /* Active tag always shows close icon or on hover? 
              User said "mouse move in then show". 
              But standard UX often keeps active tag closeable easily.
              Let's follow strict hover rule for cleaner look, or keep active one expanded.
              Screenshot usually shows active one simple.
              Let's keep hover effect even for active for consistency with "mouse in".
           */
        }
      }
      
      .close-icon-wrapper {
        width: 0;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
        opacity: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        height: 14px;
        
        &:hover {
          background-color: #b4bccc;
          color: #fff;
        }
        
        .close-icon {
           font-size: 12px;
        }
      }
    }
  }

  .tags-view-actions {
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    background: #fff;
  }

  .action-item {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #d8dce5;
    background: #fff;
    cursor: pointer;
  }
}

.contextmenu {
  margin: 0;
  background: #fff;
  z-index: 3000;
  position: fixed;
  list-style-type: none;
  padding: 5px 0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  color: #333;
  box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, .3);
  
  li {
    margin: 0;
    padding: 7px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    
    &:hover {
      background: #eee;
    }
    
    .el-icon {
      margin-right: 5px;
    }
  }
}
</style>
