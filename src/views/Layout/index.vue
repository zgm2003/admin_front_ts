<script setup lang="ts">
import { watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useIsMobile } from '@/hooks/useResponsive'
import { useWebSocket } from '@/hooks/useWebSocket'
import Aside from '@/views/Layout/components/Aside/index.vue'
import Header from '@/views/Layout/components/Header/index.vue'
import TabTag from '@/views/Layout/components/TabTag/index.vue'
import Footer from '@/views/Layout/components/Footer/index.vue'
import { useMenuStore } from '@/store/menu'

const menuStore = useMenuStore()
const isMobile = useIsMobile()
const route = useRoute()

const isPlainPage = computed(() => route.path === '/home')

useWebSocket()

watch(isMobile, (val) => {
  if (val) menuStore.mobile()
}, { immediate: true })
</script>

<template>
  <el-container class="layout-container">
    <el-drawer
      v-if="isMobile"
      v-model="menuStore.drawer"
      direction="ltr"
      size="220px"
      :with-header="false"
      class="mobile-drawer"
    >
      <Aside />
    </el-drawer>

    <el-aside v-if="!isMobile && !menuStore.contentFullscreen" width="auto" class="layout-aside">
      <Aside />
    </el-aside>

    <el-container class="layout-main">
      <el-header v-if="!menuStore.contentFullscreen" height="auto" class="layout-header">
        <Header />
      </el-header>

      <TabTag v-if="menuStore.tabtag" class="layout-tabs" />

      <el-main class="layout-content">
        <router-view v-slot="{ Component }">
          <transition
            v-if="menuStore.pageTransition"
            :name="menuStore.transitionName"
            mode="out-in"
          >
            <div :key="route.fullPath" :class="{ 'page-card': !isPlainPage }">
              <component :is="Component" />
            </div>
          </transition>

          <div v-else :class="{ 'page-card': !isPlainPage }">
            <component :is="Component" />
          </div>
        </router-view>
      </el-main>

      <el-footer v-if="menuStore.footer && !menuStore.contentFullscreen" height="48px" class="layout-footer">
        <Footer />
      </el-footer>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.layout-container { height: 100vh; overflow: hidden; background: var(--el-bg-color-page); }
.layout-aside { border-right: 1px solid var(--el-border-color-lighter); background: var(--el-bg-color); overflow: hidden; }
.layout-main { display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.layout-header, .layout-tabs { padding: 0; flex-shrink: 0; }
.layout-content { flex: 1; padding: 20px; overflow: auto; background: var(--el-bg-color-page); }
.page-card { height: 100%; background: var(--el-bg-color); border-radius: var(--el-border-radius-base); border: 1px solid var(--el-border-color-lighter); padding: 20px; overflow: auto; }
.layout-footer { padding: 0; flex-shrink: 0; border-top: 1px solid var(--el-border-color-lighter); background: var(--el-bg-color); }
:deep(.mobile-drawer .el-drawer__body) { padding: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-left-enter-active, .slide-left-leave-active, .slide-right-enter-active, .slide-right-leave-active { transition: all 0.2s; }
.slide-left-enter-from { opacity: 0; transform: translateX(20px); }
.slide-left-leave-to { opacity: 0; transform: translateX(-20px); }
.slide-right-enter-from { opacity: 0; transform: translateX(-20px); }
.slide-right-leave-to { opacity: 0; transform: translateX(20px); }
</style>
