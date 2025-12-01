<script setup>
import img404 from '@/assets/svgs/404.svg'
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="box">
    <div class="img">
      <el-image :src="img404" style="width: 500px;"></el-image>
    </div>
    <div class="text">
      <el-text>抱歉，您访问的页面不存在</el-text>
    </div>
    <div class="btn">
      <el-button type="primary" @click="router.push('/')" size="large">返回首页</el-button>
    </div>
  </div>
</template>
<style scoped lang="less">
.box { display: flex; align-content: center; justify-content: center; flex-direction: column; }
.text { text-align: center; }
.img { text-align: center; }
.btn { text-align: center; margin-top: 20px; }
</style>
