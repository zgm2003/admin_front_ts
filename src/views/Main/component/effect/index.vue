<script setup lang="ts">
import {ref} from 'vue'
import { ParticleBackground } from '@/components/ParticleBackground'

const showParticle = ref(false)
const activeTab = ref('ParticleBackground')

const particleProps = [
  {name: '-', type: '-', default: '-', desc: '该组件无 props，直接使用即可'}
]

const particleFeatures = [
  {feature: '粒子漂浮', desc: '随机分布的小圆点缓慢飘动'},
  {feature: '连线效果', desc: '相邻粒子之间会有淡淡的连线'},
  {feature: '鼠标交互', desc: '鼠标移动时粒子会被吸引'},
  {feature: '暗色适配', desc: '自动检测 dark 模式切换粒子颜色'},
  {feature: '响应式', desc: '窗口 resize 时重新初始化'}
]
</script>

<template>
  <div class="effect-demo">
    <el-tabs v-model="activeTab">
      <!-- ParticleBackground -->
      <el-tab-pane label="ParticleBackground 粒子背景" name="ParticleBackground">
        <div class="demo-section">
          <h4>效果预览</h4>
          <div class="demo-block preview-block">
            <el-button @click="showParticle = !showParticle">
              {{ showParticle ? '关闭预览' : '开启预览' }}
            </el-button>
            <el-text type="info" style="margin-left: 12px">
              点击按钮在当前页面显示粒子背景效果
            </el-text>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;ParticleBackground /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>功能特性</h4>
          <el-table :data="particleFeatures" border>
            <el-table-column prop="feature" label="特性" width="150"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
        <div class="demo-section">
          <h4>使用说明</h4>
          <div class="demo-block">
            <el-alert type="info" :closable="false">
              <pre style="margin:0;white-space:pre-wrap">组件使用 position: fixed 全屏覆盖，z-index: 0 放在最底层。
pointer-events: none 不阻挡点击事件。
适用场景：登录页、首页等需要科技感背景的页面。</pre>
            </el-alert>
          </div>
        </div>
        <div class="demo-section">
          <h4>Attributes</h4>
          <el-table :data="particleProps" border>
            <el-table-column prop="name" label="属性名" width="200"/>
            <el-table-column prop="type" label="类型" width="100"/>
            <el-table-column prop="default" label="默认值" width="100"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 粒子背景预览 -->
    <ParticleBackground v-if="showParticle"/>
  </div>
</template>

<style scoped>
.effect-demo {
  height: 100%;
}

.demo-section {
  margin-bottom: 24px;
}

.demo-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.demo-block {
  padding: 24px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  margin-bottom: 8px;
}

.demo-code {
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.preview-block {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .demo-block {
    padding: 16px;
  }

  .demo-section :deep(.el-table) {
    font-size: 12px;
  }

  .preview-block {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
