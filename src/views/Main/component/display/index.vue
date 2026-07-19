<script setup lang="ts">
import { ref } from 'vue'
import EditorDemoPane from './EditorDemoPane.vue'
import IconDemoPane from './IconDemoPane.vue'
import LoadingDemoPane from './LoadingDemoPane.vue'
import MarkdownDemoPane from './MarkdownDemoPane.vue'
import TableDemoPane from './TableDemoPane.vue'

const activeTab = ref('Table')
</script>

<template>
  <div class="display-demo">
    <el-tabs v-model="activeTab">
      <TableDemoPane />
      <EditorDemoPane />
      <LoadingDemoPane />
      <MarkdownDemoPane />
      <IconDemoPane />
    </el-tabs>
  </div>
</template>

<style scoped>
.display-demo { height: 100%; }
</style>
