<script setup>
import {ref, watch} from 'vue'
import {useIsMobile} from '@/hooks/useResponsive'
import Aside from '@/views/Layout/components/Aside/index.vue'
import Header from '@/views/Layout/components/Header/index.vue'
import TabTag from '@/views/Layout/components/TabTag/index.vue'
import Footer from '@/views/Layout/components/Footer/index.vue'
import {useUserStore} from '@/store/user'
import {useMenuStore} from '@/store/menu'
import {useRoute} from "vue-router";

const userStore = useUserStore()
const menuStore = useMenuStore()
const isMobile = useIsMobile()
const route = useRoute()
watch(isMobile, (val) => {
  if (val) menuStore.mobile()
}, {immediate: true})
</script>
<template>
  <el-container v-loading="userStore.loading">
    <el-drawer :with-header="false" v-model="menuStore.drawer" direction="ltr" size="auto" v-if="isMobile">
      <Aside/>
    </el-drawer>
    <el-aside width="auto" v-else>
      <Aside/>
    </el-aside>
    <el-container>
      <el-header height="auto">
        <Header/>
      </el-header>
      <TabTag class="tab-tag" v-if="menuStore.tabtag"/>
      <el-main>
        <router-view v-slot="{ Component }">
          <transition
              v-if="menuStore.pageTransition"
              :name="menuStore.transitionName"
              mode="out-in"
              appear
          >
            <el-card :key="route.fullPath" shadow="never">
              <component :is="Component"/>
            </el-card>
          </transition>

          <el-card v-else shadow="never">
            <component :is="Component"/>
          </el-card>
        </router-view>

      </el-main>
      <el-footer v-if="menuStore.footer">
        <Footer/>
      </el-footer>
    </el-container>
  </el-container>
</template>
<style scoped>
.el-container {
  height: 100vh;
  overflow: hidden;
}
.el-aside {
  border-right: 1px solid var(--el-border-color);
}
.el-header,
.el-footer {
  padding: 0;
}
.el-main {
  padding: 16px;
  background: var(--el-bg-color-page);
  overflow: hidden;
}
.el-main > :deep(.el-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.el-main > :deep(.el-card) > :deep(.el-card__body) {
  flex: 1;
  overflow: hidden;
}
:deep(.el-drawer__body) {
  padding: 0;
}
@media (max-width: 768px) {
  .el-main {
    padding: 12px;
  }
}
</style>
