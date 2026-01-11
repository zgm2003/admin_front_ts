<script setup lang="ts">
import {ref} from 'vue'
import {useI18n} from 'vue-i18n'
import UserList from './components/UserList/index.vue'
import SessionList from './components/SessionList/index.vue'

const {t} = useI18n()
const activeTab = ref('userList')
</script>

<template>
  <div class="user-manager-page">
    <el-tabs v-model="activeTab" class="user-tabs">
      <el-tab-pane :label="t('user.tabs.userList')" name="userList" lazy>
        <UserList/>
      </el-tab-pane>
      <el-tab-pane :label="t('user.tabs.sessionList')" name="sessionList" lazy>
        <SessionList v-if="activeTab === 'sessionList'"/>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.user-manager-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.user-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.user-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.user-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  padding: 16px 0;
}

.user-tabs :deep(.el-tab-pane) {
  height: 100%;
  background: var(--el-bg-color);
  border-radius: 8px;
}
</style>
