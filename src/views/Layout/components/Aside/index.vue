<!-- MainMenu.vue -->
<template>
  <el-menu
      :default-active="menuStore.selectedMenu"
      class="el-menu-vertical-demo"
      :collapse="menuStore.collapse"
      :background-color="menuStore.menuColor"
      text-color="#fff"
      active-text-color="#fff"
      :unique-opened="menuStore.uniqueOpen"
  >
    <el-menu-item index="0">
      <el-icon><ElemeFilled /></el-icon>
      <el-text size="large" type="primary">智澜</el-text>
    </el-menu-item>
    <MenuItem
        v-for="item in userStore.permissions"
        :key="item.index"
        :item="item"
    />
  </el-menu>
  </template>

<script setup>
import { useMenuStore } from '@/store/menu.ts';
import { useUserStore } from '@/store/user.ts';
import MenuItem from './components/MenuItem.vue';

const menuStore = useMenuStore();
const userStore = useUserStore();
</script>

<style scoped>
.el-menu-vertical-demo{ height: 100% }
.el-menu-item{ width: 200px }
</style>

