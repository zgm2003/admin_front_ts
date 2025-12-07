<script setup>
import {ref} from 'vue'
import { useIsMobile } from '@/utils/responsive'
import Aside from '@/views/Layout/components/Aside.vue'
import Header from '@/views/Layout/components/Header.vue'
import TabTag from '@/views/Layout/components/TabTag.vue'
import Footer from '@/views/Layout/components/Footer.vue'
import {useUserStore} from '@/store/user'
import {useMenuStore} from '@/store/menu'

const userStore = useUserStore()
const menuStore = useMenuStore()
const isMobile = useIsMobile()
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
        <el-card>
          <router-view/>
        </el-card>
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
  overflow: hidden
}

.el-header, .el-footer {
  padding: 0
}

:deep(.el-drawer__body) {
  padding: 0
}

.el-main {
  padding: 16px;
  background: var(--el-bg-color-page)
}


@media (max-width: 768px) {
  .el-main {
    padding: 12px
  }

}
</style>
