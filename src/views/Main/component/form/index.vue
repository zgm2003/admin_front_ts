<script setup lang="ts">
import { ref } from 'vue'
import IconSelectDemoPane from './IconSelectDemoPane.vue'
import RemoteSelectDemoPane from './RemoteSelectDemoPane.vue'
import SearchDemoPane from './SearchDemoPane.vue'
import SendCodeDemoPane from './SendCodeDemoPane.vue'

const activeTab = ref('Search')
</script>

<template>
  <div class="form-demo">
    <el-tabs v-model="activeTab">
      <SearchDemoPane />
      <SendCodeDemoPane />
      <IconSelectDemoPane />
      <RemoteSelectDemoPane />
    </el-tabs>
  </div>
</template>

<style scoped>
.form-demo { height: 100%; }
</style>
