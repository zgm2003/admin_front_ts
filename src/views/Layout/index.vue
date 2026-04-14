<script setup lang="ts">
import { watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NotificationRuntime } from '@/components/NotificationRuntime'
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
    <NotificationRuntime />

    <el-drawer
      v-if="isMobile"
      v-model="menuStore.drawer"
      direction="ltr"
      size="272px"
      :with-header="false"
      class="mobile-drawer"
    >
      <Aside />
    </el-drawer>

    <el-aside
      v-if="!isMobile && !menuStore.contentFullscreen"
      width="auto"
      class="layout-aside"
      :class="{ 'layout-aside--collapse': menuStore.collapse }"
    >
      <Aside />
    </el-aside>

    <el-container class="layout-main">
      <el-header
        v-if="!menuStore.contentFullscreen"
        height="auto"
        class="layout-header"
        :class="{ 'layout-header--detached': !menuStore.tabtag }"
      >
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
            <div :key="route.fullPath + '::' + menuStore.refreshKey" class="layout-view" :class="{ 'page-card': !isPlainPage }">
              <component :is="Component" />
            </div>
          </transition>

          <div v-else class="layout-view" :class="{ 'page-card': !isPlainPage }">
            <component :is="Component" :key="route.fullPath + '::' + menuStore.refreshKey" />
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
.layout-container {
  height: 100dvh;
  overflow: hidden;
  background: transparent;
}

.layout-aside {
  width: 248px;
  flex: 0 0 248px;
  overflow: hidden;
  background: transparent;
}

.layout-aside--collapse {
  width: 80px;
  flex-basis: 80px;
}

.layout-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-header,
.layout-tabs {
  padding: 0;
  flex-shrink: 0;
}

.layout-header {
  overflow: hidden;
  border-bottom: 1px solid var(--shell-line);
  background: var(--shell-panel-strong);
}

.layout-tabs {
  overflow: hidden;
  border-bottom: 1px solid var(--shell-line);
  background: var(--shell-panel);
}

.layout-content {
  flex: 1;
  padding: 8px;
  overflow: auto;
  background: transparent;
}

.layout-view {
  min-height: 100%;
  height: 100%;
}

.page-card {
  height: 100%;
  padding: 16px;
  overflow: visible;
  background: var(--shell-panel-strong);
  border: 1px solid var(--shell-line);
  border-radius: 12px;
  box-shadow: var(--shell-shadow-soft);
}

.layout-footer {
  margin-top: 0;
  padding: 0 8px;
  flex-shrink: 0;
  background: transparent;
}

:deep(.mobile-drawer .el-drawer__body) {
  padding: 0;
  overscroll-behavior: contain;
}

:deep(.mobile-drawer .el-drawer) {
  background: var(--shell-nav-bg);
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity var(--app-motion-base) var(--app-ease-standard),
    transform var(--app-motion-base) var(--app-ease-emphasized);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-from {
  transform: translateY(8px);
}

.fade-leave-to {
  transform: translateY(-4px);
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    opacity var(--app-motion-base) var(--app-ease-standard),
    transform var(--app-motion-base) var(--app-ease-emphasized);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(16px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-16px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

@media (max-width: 768px) {
  .layout-view {
    height: auto;
  }

  .layout-aside {
    width: auto;
    flex-basis: auto;
    padding: 0;
    transition: none;
  }

  .layout-main {
    padding: 0;
  }

  .layout-header {
    border-inline: none;
    border-top: none;
    border-bottom: 1px solid var(--shell-line);
    border-radius: 0;
    box-shadow: none;
  }

  .layout-tabs {
    border-inline: none;
    box-shadow: none;
  }

  .layout-content {
    padding: 10px;
    -webkit-overflow-scrolling: touch;
  }

  .page-card {
    height: auto;
    min-height: 100%;
    padding: 12px;
    overflow: visible;
    box-shadow: none;
    border-radius: 14px;
  }
}

@media (max-width: 480px) {
  .layout-content,
  .page-card {
    padding: 10px;
  }

  .page-card {
    border-radius: 12px;
  }
}
</style>
