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
    <!-- logo 或首页按钮 -->
    <el-menu-item index="0">
      <el-icon><ElemeFilled /></el-icon>
      <el-text size="large" type="primary">智澜</el-text>
    </el-menu-item>
    <!-- 遍历所有权限节点 -->
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
import MenuItem from '@/components/MenuItem';

const menuStore = useMenuStore();
const userStore = useUserStore();
</script>

<style scoped>
.el-menu-vertical-demo{
  height: 100%;
}
.el-menu-item{
  width: 200px;
}
</style>
