<script setup lang="ts">
import {ref} from 'vue'
import {useI18n} from 'vue-i18n'
import RunList from './components/RunList/index.vue'
import RunStats from './components/RunStats/index.vue'

const {t} = useI18n()
const activeTab = ref('list')
</script>

<template>
  <div class="runs-page">
    <el-tabs v-model="activeTab" class="runs-tabs">
      <el-tab-pane :label="t('aiRuns.tabs.list')" name="list" lazy>
        <RunList />
      </el-tab-pane>
      <el-tab-pane :label="t('aiRuns.tabs.stats')" name="stats" lazy>
        <RunStats v-if="activeTab === 'stats'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.runs-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.runs-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.runs-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.runs-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  padding: 16px 0;
}

.runs-tabs :deep(.el-tab-pane) {
  height: 100%;
  background: var(--el-bg-color);
  border-radius: 8px;
}
</style>
