<template>
  <el-menu
    :default-active="menuStore.selectedMenu"
    :collapse="menuStore.collapse"
    :collapse-transition="false"
    :unique-opened="menuStore.uniqueOpen"
    class="aside-menu"
  >
    <div class="logo-container" :class="{ 'is-collapse': menuStore.collapse }">
      <div class="logo-icon">
        <img src="/logo.png" alt="Logo" />
      </div>
      <transition name="fade">
        <span v-show="!menuStore.collapse" class="logo-text">智澜</span>
      </transition>
    </div>
    <MenuItem v-for="item in userStore.permissions" :key="item.index" :item="item" />
  </el-menu>
</template>

<script setup>
import { useMenuStore } from '@/store/menu';
import { useUserStore } from '@/store/user';
import MenuItem from './components/MenuItem.vue';

const menuStore = useMenuStore();
const userStore = useUserStore();
</script>

<style scoped lang="scss">
.aside-menu {
  height: 100%;
  border-right: none;
  background: var(--bg-card);
  
  &:not(.el-menu--collapse) {
    width: 220px;
  }
}

.logo-container {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
  
  &.is-collapse {
    padding: 0;
    justify-content: center;
  }
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  img {
    width: 24px;
    height: 24px;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

/* 菜单项样式覆盖 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  border-radius: 8px;
  color: var(--text-secondary);
  
  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
  
  .el-icon {
    font-size: 18px;
  }
}

/* 展开状态 */
:deep(.el-menu:not(.el-menu--collapse)) {
  .el-menu-item,
  .el-sub-menu__title {
    margin: 4px 8px;
    
    .el-icon {
      margin-right: 12px;
    }
  }
}

:deep(.el-menu-item.is-active) {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    background: var(--el-color-primary);
    border-radius: 0 3px 3px 0;
  }
}

:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: var(--el-color-primary);
}

/* 折叠状态 */
:deep(.el-menu--collapse) {
  width: 64px;
  
  .el-menu-item {
    margin: 4px auto !important;
    padding: 0 !important;
    width: 48px !important;
    display: flex !important;
    justify-content: center !important;
    
    .el-icon {
      margin: 0 !important;
    }
  }
  
  .el-sub-menu {
    .el-sub-menu__title {
      margin: 4px auto !important;
      padding: 0 !important;
      width: 48px !important;
      display: flex !important;
      justify-content: center !important;
      
      .el-icon {
        margin: 0 !important;
      }
      
      span {
        display: none !important;
      }
    }
    
    .el-sub-menu__icon-arrow {
      display: none !important;
    }
  }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
