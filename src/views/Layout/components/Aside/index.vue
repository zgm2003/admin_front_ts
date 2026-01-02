<template>
  <el-menu
    :default-active="menuStore.selectedMenu"
    :collapse="menuStore.collapse"
    :collapse-transition="false"
    :unique-opened="menuStore.uniqueOpen"
    class="aside-menu"
  >
    <div class="logo-container" :class="{ 'is-collapse': menuStore.collapse }">
      <el-avatar :size="32" src="/logo.png"/>
      <span v-show="!menuStore.collapse" class="logo-text">智澜</span>
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

<style scoped>
.aside-menu {
  height: 100%;
  border-right: none;
}
.aside-menu:not(.el-menu--collapse) {
  width: 200px;
}
.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  border-bottom: 1px solid #e6e6e6;
}
.logo-container.is-collapse {
  padding: 0;
}
.logo-text {
  margin-left: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
</style>

