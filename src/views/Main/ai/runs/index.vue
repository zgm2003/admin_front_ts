<script setup lang="ts">
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRoute, useRouter} from 'vue-router'
import type {AiRunListParams} from '@/api/ai/runs'
import {serializeRunListQuery} from './components/RunStats/dashboard-presenter'
import RunList from './components/RunList/index.vue'
import RunStats from './components/RunStats/index.vue'

const {t} = useI18n()
const route = useRoute()
const router = useRouter()
type RunPageTab = 'list' | 'stats'

const activeTab = computed<RunPageTab>({
  get: () => route.query.tab === 'stats' ? 'stats' : 'list',
  set: (tab) => {
    if (tab === activeTab.value) return
    void router.push({
      path: route.path,
      query: { ...route.query, tab },
    })
  },
})

function handleDrilldown(params: AiRunListParams) {
  void router.push({
    path: route.path,
    query: { tab: 'list', ...serializeRunListQuery(params) },
  })
}
</script>

<template>
  <div class="runs-page">
    <el-tabs
      v-model="activeTab"
      class="runs-tabs"
    >
      <el-tab-pane
        :label="t('aiRuns.tabs.list')"
        name="list"
        lazy
      >
        <RunList />
      </el-tab-pane>
      <el-tab-pane
        :label="t('aiRuns.tabs.stats')"
        name="stats"
        lazy
      >
        <RunStats @drilldown="handleDrilldown" />
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
