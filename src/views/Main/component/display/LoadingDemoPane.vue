<script setup lang="ts">
const loadingDesc = `CustomLoading 是全局加载组件，绑定 userStore.loading 状态。
当 userStore.loading = true 时自动显示，无需手动调用。
通常在 API 请求开始时设置 loading = true，结束后设置为 false。`
</script>

<template>
  <el-tab-pane
    label="CustomLoading 加载"
    name="CustomLoading"
  >
    <div class="demo-section">
      <h4>说明</h4>
      <div class="demo-block">
        <el-alert
          type="info"
          :closable="false"
        >
          <pre style="margin:0;white-space:pre-wrap">{{ loadingDesc }}</pre>
        </el-alert>
      </div>
      <div class="demo-code">
        <el-text type="info">
          &lt;CustomLoading /&gt; (放在 App.vue 根节点)
        </el-text>
      </div>
    </div>
  </el-tab-pane>
</template>

<style scoped src="./pane.styles.css"></style>
