<script setup>
import { ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import Aside from '@/views/Layout/components/Aside.vue'
import Header from '@/views/Layout/components/Header.vue'
import TabTag from '@/views/Layout/components/TabTag.vue'
import Footer from '@/views/Layout/components/Footer.vue'
import { useUserStore } from '@/store/user'
import { useMenuStore } from '@/store/menu'

const userStore = useUserStore()
const menuStore = useMenuStore()
const isMobile = useMediaQuery('(max-width: 768px)')
</script>
<template>
  <el-container v-loading="userStore.loading">
    <el-drawer :with-header="false" v-model="menuStore.drawer" direction="ltr" size="auto" v-if="isMobile">
      <Aside />
    </el-drawer>
    <el-aside width="auto" v-else><Aside /></el-aside>
    <el-container>
      <el-header><Header /></el-header>
      <TabTag style="margin-left: 10px;" v-if="menuStore.tabtag && !isMobile" />
      <el-main>
        <router-view />
      </el-main>
      <el-footer v-if="menuStore.footer"><Footer /></el-footer>
    </el-container>
  </el-container>
</template>
<style scoped>
.el-container { height: 100vh; overflow: hidden }
.el-header, .el-main, .el-footer { padding: 0 }
:deep(.el-drawer__body) { padding: 0 }
@media (max-width: 768px) {
  .el-header{
    display: flex;
    align-items: center;
  }
}
</style>
