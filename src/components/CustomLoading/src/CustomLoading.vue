<template>
<div class="background" v-if="userStore.loading">
  <div class="sk-cube-grid">
    <div class="sk-cube sk-cube1"></div>
    <div class="sk-cube sk-cube2"></div>
    <div class="sk-cube sk-cube3"></div>
    <div class="sk-cube sk-cube4"></div>
    <div class="sk-cube sk-cube5"></div>
    <div class="sk-cube sk-cube6"></div>
    <div class="sk-cube sk-cube7"></div>
    <div class="sk-cube sk-cube8"></div>
    <div class="sk-cube sk-cube9"></div>
  </div>
  <el-text type="primary">正在加载中...</el-text>
</div>
</template>

<script setup>
import { useUserStore } from "@/store/user";
const userStore = useUserStore();
</script>

<style scoped lang="scss">
.background{
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.sk-cube-grid { width: 100px; height: 100px; margin: 20px }
.sk-cube-grid .sk-cube { width: 33%; height: 33%; float: left; background: linear-gradient(135deg, #3B82F6, #60A5FA); animation: sk-cubeGridScaleDelay 1.3s infinite ease-in-out; border-radius: 4px; box-shadow: 0 0 4px rgba(64, 158, 255, 0.6); transform-origin: center center; transition: all 0.3s ease }
.sk-cube-grid .sk-cube1 { animation-delay: 0.2s }
.sk-cube-grid .sk-cube2 { animation-delay: 0.3s }
.sk-cube-grid .sk-cube3 { animation-delay: 0.4s }
.sk-cube-grid .sk-cube4 { animation-delay: 0.1s }
.sk-cube-grid .sk-cube5 { animation-delay: 0.2s }
.sk-cube-grid .sk-cube6 { animation-delay: 0.3s }
.sk-cube-grid .sk-cube7 { animation-delay: 0s }
.sk-cube-grid .sk-cube8 { animation-delay: 0.1s }
.sk-cube-grid .sk-cube9 { animation-delay: 0.2s }
@keyframes sk-cubeGridScaleDelay { 0%, 70%, 100% { transform: scale3D(1, 1, 1) } 35% { transform: scale3D(0, 0, 1) } }
</style>
