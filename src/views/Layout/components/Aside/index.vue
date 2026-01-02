<template>
  <el-menu
    :default-active="menuStore.selectedMenu"
    :collapse="menuStore.collapse"
    :collapse-transition="false"
    :unique-opened="menuStore.uniqueOpen"
    class="aside-menu"
  >
    <el-menu-item index="0">
      <el-icon><ElemeFilled /></el-icon>
      <el-text size="large" type="primary">智澜</el-text>
    </el-menu-item>
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
</style>

